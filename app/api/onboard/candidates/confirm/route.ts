import { NextResponse, type NextRequest } from 'next/server';
import { isPresentationRequest } from '../../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { maskTechnicalError } from '../../../../../src/domain/slc-copy';
import type { ScheduleItem, ScheduleType } from '../../../../../src/types/slc.types';

type DbError = { message: string };
type ScheduleCandidateRow = {
  id: string;
  patient_id: string;
  type: ScheduleType;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
};
type CandidateEdit = { id: string; type: ScheduleType; title: string; scheduled_at: string | null; dose: string | null; unit: string | null };
type ConfirmBody = { confirmedIds?: unknown; rejectedIds?: unknown; candidateEdits?: unknown };
interface ScheduleCandidatesTable {
  select(columns: string): {
    in(column: 'id', values: string[]): {
      eq(column: 'patient_id', value: string): Promise<{ data: ScheduleCandidateRow[] | null; error: DbError | null }>;
    };
  };
  update(values: { status: 'confirmed' | 'rejected' }): {
    in(column: 'id', values: string[]): { eq(column: 'patient_id', value: string): Promise<{ error: DbError | null }> };
  };
}

interface ScheduleItemsTable {
  insert(rows: Array<Record<string, unknown>>): { select(): Promise<{ data: ScheduleItem[] | null; error: DbError | null }> };
}

interface OnboardConfirmClient {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  from(table: 'schedule_candidates'): ScheduleCandidatesTable;
  from(table: 'schedule_items'): ScheduleItemsTable;
}

export async function POST(request: NextRequest) {
  const supabase = (await createCookieBackedSupabaseClient()) as unknown as OnboardConfirmClient;
  const { data: { user } } = await supabase.auth.getUser();

  const body = (await request.json().catch(() => ({}))) as ConfirmBody;
  const confirmedIds = normalizeIds(body.confirmedIds);
  const rejectedIds = normalizeIds(body.rejectedIds);
  const candidateEdits = normalizeCandidateEdits(body.candidateEdits);
  const requestedIds = unique([...confirmedIds, ...rejectedIds]);
  if (requestedIds.length === 0) return NextResponse.json({ savedCount: 0, items: [] });

  if (!user) {
    if (!isPresentationRequest(request) || !hasPrivacyGateCookie(request.headers.get('cookie'))) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return confirmPresentationCandidates(confirmedIds, candidateEdits);
  }

  const { data: ownedCandidates, error: selectError } = await supabase
    .from('schedule_candidates')
    .select('id, patient_id, type, title, scheduled_at, dose, unit')
    .in('id', requestedIds)
    .eq('patient_id', user.id);

  if (selectError) return NextResponse.json({ error: maskTechnicalError(selectError.message) }, { status: 500 });
  if ((ownedCandidates ?? []).length !== requestedIds.length) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const editById = new Map(candidateEdits.map((edit) => [edit.id, edit]));
  const candidateById = new Map((ownedCandidates ?? []).map((candidate) => [candidate.id, { ...candidate, ...editById.get(candidate.id) }]));
  const rows = confirmedIds
    .map((id) => candidateById.get(id))
    .filter((candidate): candidate is ScheduleCandidateRow => Boolean(candidate))
    .map((candidate) => ({
      patient_id: user.id,
      medication_id: null,
      type: candidate.type,
      title: candidate.title,
      dose: candidate.dose,
      unit: candidate.unit,
      scheduled_at: candidate.scheduled_at ?? new Date().toISOString(),
      source: 'capture',
    }));

  let items: ScheduleItem[] = [];
  if (rows.length) {
    const { data, error } = await supabase.from('schedule_items').insert(rows).select();
    if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
    items = data ?? [];

    const { error: updateError } = await supabase.from('schedule_candidates').update({ status: 'confirmed' }).in('id', confirmedIds).eq('patient_id', user.id);
    if (updateError) return NextResponse.json({ error: maskTechnicalError(updateError.message) }, { status: 500 });
  }

  if (rejectedIds.length) {
    const { error } = await supabase.from('schedule_candidates').update({ status: 'rejected' }).in('id', rejectedIds).eq('patient_id', user.id);
    if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  }

  return NextResponse.json({ savedCount: items.length, items });
}



function confirmPresentationCandidates(confirmedIds: string[], candidateEdits: CandidateEdit[]) {
  const editById = new Map(candidateEdits.map((edit) => [edit.id, edit]));
  const items = confirmedIds
    .map((id) => editById.get(id))
    .filter((candidate): candidate is CandidateEdit => Boolean(candidate))
    .map((candidate) => ({
      id: `presentation-item-${candidate.id}`,
      patient_id: 'presentation',
      medication_id: null,
      type: candidate.type,
      title: candidate.title,
      dose: candidate.dose,
      unit: candidate.unit,
      scheduled_at: candidate.scheduled_at,
      status: 'upcoming',
      source: 'capture',
      created_at: new Date().toISOString(),
    }));

  return NextResponse.json({ savedCount: items.length, items, presentation: true });
}

function hasPrivacyGateCookie(cookieHeader: string | null) {
  return cookieHeader?.split(';').some((part) => {
    const trimmed = part.trim();
    return trimmed === 'fevio_privacy_gate_v1=accepted' || trimmed === 'fevio_privacy_accepted=1';
  }) ?? false;
}

function normalizeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return unique(value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).map((id) => id.trim()));
}

function normalizeCandidateEdits(value: unknown): CandidateEdit[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCandidateEdit).filter((edit): edit is CandidateEdit => edit !== null);
}

function normalizeCandidateEdit(value: unknown): CandidateEdit | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
  const type = normalizeScheduleType(candidate.type);
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!id || !type || !title) return null;
  return {
    id,
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
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeNullableIso(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
