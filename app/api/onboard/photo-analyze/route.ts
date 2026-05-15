import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isPresentationRequest } from '../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { createSupabaseServiceRoleClient } from '../../../../src/lib/server-supabase-admin';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';
import type { ScheduleType } from '../../../../src/types/slc.types';

const CLINIC_PHOTOS_BUCKET = 'clinic-photos';
const SIGNED_URL_EXPIRES_SECONDS = 60;

type DbError = { message: string };
type ExtractedCandidate = {
  type: string;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
};
type InsertedCandidate = ExtractedCandidate & { id: string };
type PhotoAnalyzeBody = { imagePath?: unknown };
type OnboardAnalyzeClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  functions: {
    invoke(name: 'schedule-extract', options: { body: { mode: 'image'; imagePath: string; patientId: string; signedUrl?: string } }): Promise<{ data: { candidates?: ExtractedCandidate[] } | null; error: DbError | null }>;
  };
  from(table: 'schedule_candidates'): {
    insert(rows: Array<Record<string, unknown>>): { select(): Promise<{ data: InsertedCandidate[] | null; error: DbError | null }> };
  };
};
type AdminStorageClient = {
  storage: {
    from(bucket: typeof CLINIC_PHOTOS_BUCKET): {
      createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl?: string; signedURL?: string } | null; error: DbError | null }>;
      remove(paths: string[]): Promise<{ data: unknown; error: DbError | null }>;
    };
  };
};

export async function POST(request: NextRequest) {
  const supabase = (await createCookieBackedSupabaseClient()) as unknown as OnboardAnalyzeClient;
  const { data: { user } } = await supabase.auth.getUser();

  const body = (await request.json().catch(() => ({}))) as PhotoAnalyzeBody;
  const presentation = !user && isPresentationRequest(request);
  if (presentation && !hasPrivacyGateCookie(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'privacy_gate_required' }, { status: 403 });
  }
  if (!user && !presentation) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const imagePath = normalizeImagePath(body.imagePath, user?.id ?? 'presentation');
  if (!imagePath) return NextResponse.json({ error: 'valid imagePath is required' }, { status: 400 });

  const signedUrl = await createSixtySecondSignedUrl(imagePath).catch(() => null);
  if (!signedUrl) return NextResponse.json({ candidates: [] });

  const { data } = await supabase.functions.invoke('schedule-extract', {
    body: { mode: 'image', imagePath, patientId: user?.id ?? 'presentation', signedUrl },
  });
  if (presentation) await removePresentationImage(imagePath).catch(() => null);

  const candidates = normalizeCandidates(data?.candidates);
  if (candidates.length === 0) return NextResponse.json({ candidates: [] });

  if (presentation) {
    return NextResponse.json({ candidates: withPresentationIds(candidates) });
  }

  const rows = candidates.map((candidate) => ({
    patient_id: user!.id,
    image_path: imagePath,
    raw_text: null,
    status: 'draft',
    type: candidate.type,
    title: candidate.title,
    scheduled_at: candidate.scheduled_at,
    dose: candidate.dose,
    unit: candidate.unit,
  }));

  const { data: inserted, error } = await supabase.from('schedule_candidates').insert(rows).select();
  if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });

  return NextResponse.json({ candidates: inserted ?? [] });
}

function hasPrivacyGateCookie(cookieHeader: string | null) {
  return cookieHeader?.split(';').some((part) => {
    const trimmed = part.trim();
    return trimmed === 'fevio_privacy_gate_v1=accepted' || trimmed === 'fevio_privacy_accepted=1';
  }) ?? false;
}

function withPresentationIds(candidates: ExtractedCandidate[]): InsertedCandidate[] {
  return candidates.map((candidate) => ({ id: `presentation-${randomUUID()}`, ...candidate }));
}

async function createSixtySecondSignedUrl(imagePath: string) {
  const admin = createSupabaseServiceRoleClient() as unknown as AdminStorageClient;
  const { data, error } = await admin.storage.from(CLINIC_PHOTOS_BUCKET).createSignedUrl(imagePath, SIGNED_URL_EXPIRES_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? data?.signedURL ?? null;
}

async function removePresentationImage(imagePath: string) {
  if (!imagePath.startsWith('presentation/')) return;
  const admin = createSupabaseServiceRoleClient() as unknown as AdminStorageClient;
  await admin.storage.from(CLINIC_PHOTOS_BUCKET).remove([imagePath]);
}

function normalizeImagePath(value: unknown, userId: string) {
  const text = typeof value === 'string' ? value.replace(/^\/+/, '').trim() : '';
  if (!text || text.includes('..')) return '';
  return text.startsWith(`${userId}/`) ? text : '';
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCandidates(value: unknown): ExtractedCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCandidate).filter((candidate): candidate is ExtractedCandidate => candidate !== null);
}

function normalizeCandidate(value: unknown): ExtractedCandidate | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const type = normalizeScheduleType(candidate.type);
  const title = normalizeText(candidate.title);
  if (!type || !title) return null;
  return {
    type,
    title,
    scheduled_at: normalizeNullableIso(candidate.scheduled_at),
    dose: normalizeNullableText(candidate.dose),
    unit: normalizeNullableText(candidate.unit),
  };
}

function normalizeScheduleType(value: unknown): ScheduleType | null {
  return value === 'injection' || value === 'medication' || value === 'clinic' ? value : null;
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeNullableIso(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
