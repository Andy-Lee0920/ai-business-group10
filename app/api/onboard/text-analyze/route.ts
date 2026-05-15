import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';
import type { ScheduleType } from '../../../../src/types/slc.types';

type DbError = { message: string };
type ExtractedCandidate = {
  type: string;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
};
type InsertedCandidate = ExtractedCandidate & { id: string };
type TextAnalyzeBody = { rawText?: unknown };
type OnboardAnalyzeClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  functions: {
    invoke(name: 'schedule-extract', options: { body: { mode: 'text'; rawText: string; patientId: string } }): Promise<{ data: { candidates?: ExtractedCandidate[] } | null; error: DbError | null }>;
  };
  from(table: 'schedule_candidates'): {
    insert(rows: Array<Record<string, unknown>>): { select(): Promise<{ data: InsertedCandidate[] | null; error: DbError | null }> };
  };
};

export async function POST(request: NextRequest) {
  const supabase = (await createCookieBackedSupabaseClient()) as unknown as OnboardAnalyzeClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as TextAnalyzeBody;
  const rawText = normalizeText(body.rawText);
  if (!rawText) return NextResponse.json({ error: 'rawText is required' }, { status: 400 });

  const { data } = await supabase.functions.invoke('schedule-extract', {
    body: { mode: 'text', rawText, patientId: user.id },
  });

  const candidates = normalizeCandidates(data?.candidates);
  if (candidates.length === 0) return NextResponse.json({ candidates: [] });

  const rows = candidates.map((candidate) => ({
    patient_id: user.id,
    image_path: null,
    raw_text: rawText,
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
