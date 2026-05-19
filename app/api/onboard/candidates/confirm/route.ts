import { NextResponse, type NextRequest } from 'next/server';
import { isPresentationRequest } from '../../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { maskTechnicalError } from '../../../../../src/domain/slc-copy';
import type { ScheduleItem, ScheduleType } from '../../../../../src/types/slc.types';

type DbError = { message: string };
type SplitCandidateRow = {
  id: string;
  couple_id: string;
  draft_id: string;
  visit_input_id: string;
  source_text: string;
  suggested_card_type: 'injection' | 'medication' | 'clinic_visit' | 'clinic_confirmation' | 'partner_support' | 'record' | 'general_action' | null;
};
type CandidateOwner = 'my_action' | 'partner_action';
type CandidateEdit = { id: string; type: ScheduleType; title: string; scheduled_at: string | null; dose: string | null; unit: string | null; assignedTo: CandidateOwner };
type ConfirmBody = { confirmedIds?: unknown; rejectedIds?: unknown; candidateEdits?: unknown };
interface SplitCandidatesTable {
  select(columns: string): {
    in(column: 'id', values: string[]): Promise<{ data: SplitCandidateRow[] | null; error: DbError | null }>;
  };
}

interface CareActionCardsTable {
  insert(rows: Array<Record<string, unknown>>): { select(): Promise<{ data: ScheduleItem[] | null; error: DbError | null }> };
}

interface OnboardConfirmClient {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  rpc(name: 'mark_first_capture_completed', args: { p_couple_id: string }): Promise<{ data: unknown; error: DbError | null }>;
  from(table: 'split_candidates'): SplitCandidatesTable;
  from(table: 'care_action_cards'): CareActionCardsTable;
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
    .from('split_candidates')
    .select('id, couple_id, draft_id, visit_input_id, source_text, suggested_card_type')
    .in('id', requestedIds);

  if (selectError) return NextResponse.json({ error: maskTechnicalError(selectError.message) }, { status: 500 });
  if ((ownedCandidates ?? []).length !== requestedIds.length) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const editById = new Map(candidateEdits.map((edit) => [edit.id, edit]));
  const candidateById = new Map((ownedCandidates ?? []).map((candidate) => [candidate.id, candidate]));
  const rows = confirmedIds
    .map((id) => {
      const candidate = candidateById.get(id);
      const edit = editById.get(id);
      return candidate && edit ? { candidate, edit } : null;
    })
    .filter((entry): entry is { candidate: SplitCandidateRow; edit: CandidateEdit } => Boolean(entry))
    .map((candidate) => ({
      couple_id: candidate.candidate.couple_id,
      created_by: user.id,
      source_input_id: candidate.candidate.visit_input_id,
      split_candidate_id: candidate.candidate.id,
      assignee_role: candidate.edit.assignedTo === 'partner_action' ? 'partner' : 'primary_user',
      card_type: toCareCardType(candidate.edit.type),
      title: candidate.edit.title,
      description: formatDose(candidate.edit.dose, candidate.edit.unit),
      source_text: candidate.candidate.source_text,
      scheduled_at: candidate.edit.scheduled_at ?? new Date().toISOString(),
      status: 'confirmed',
      confirmation_required: false,
      user_marked_important: candidate.edit.type === 'injection',
      partner_visible: candidate.edit.assignedTo === 'partner_action',
    }));

  let items: ScheduleItem[] = [];
  if (rows.length) {
    const { data, error } = await supabase.from('care_action_cards').insert(rows).select();
    if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
    items = (data ?? []).map(toSavedScheduleItem);
    const coupleId = rows[0]?.couple_id;
    if (typeof coupleId === 'string') {
      const { error: captureStateError } = await supabase.rpc('mark_first_capture_completed', { p_couple_id: coupleId });
      if (captureStateError) return NextResponse.json({ error: maskTechnicalError(captureStateError.message) }, { status: 500 });
    }
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
    assignedTo: normalizeCandidateOwner(candidate.assignedTo),
  };
}

function normalizeCandidateOwner(value: unknown): CandidateOwner {
  return value === 'partner_action' ? 'partner_action' : 'my_action';
}

function normalizeScheduleType(value: unknown): ScheduleType | null {
  return value === 'injection' || value === 'medication' || value === 'clinic' ? value : null;
}

function toCareCardType(type: ScheduleType) {
  if (type === 'clinic') return 'clinic_visit';
  return type;
}

function toSavedScheduleItem(card: ScheduleItem): ScheduleItem {
  const row = card as unknown as Record<string, unknown>;
  const cardType = row.card_type === 'clinic_visit' || row.card_type === 'clinic_confirmation' ? 'clinic' : row.card_type;
  return {
    id: String(row.id ?? ''),
    patient_id: String(row.created_by ?? row.patient_id ?? ''),
    medication_id: null,
    type: cardType === 'injection' || cardType === 'medication' || cardType === 'clinic' ? cardType : 'clinic',
    title: String(row.title ?? ''),
    dose: null,
    unit: null,
    scheduled_at: typeof row.scheduled_at === 'string' ? row.scheduled_at : new Date().toISOString(),
    status: 'upcoming',
    source: 'capture',
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

function formatDose(dose: string | null, unit: string | null) {
  if (!dose && !unit) return null;
  return `${dose ?? ''}${dose && unit ? ' ' : ''}${unit ?? ''}`.trim();
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
