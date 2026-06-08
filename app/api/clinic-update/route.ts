import { NextResponse, type NextRequest } from 'next/server';
import { splitLines, inferCardType } from '../../../src/domain/line-split';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { createCaptureStore } from '../../../src/lib/capture-confirm-store';
import { createConfirmedCareActions, type CanonicalCareActionCreate, type CanonicalCareActionRow, type CanonicalCareActionWriterClient } from '../../../src/lib/canonical-care-action-writer';
import { isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { maskTechnicalError } from '../../../src/domain/slc-copy';
import type { CardType } from '../../../src/types/care-cards.types';
import type { ScheduleType } from '../../../src/types/slc.types';

type DbError = { message: string };
type SplitCandidateInsertRow = {
  couple_id: string;
  draft_id: string;
  visit_input_id: string;
  source_text: string;
  source_offset_start: number | null;
  source_offset_end: number | null;
  assigned_to: 'my_action';
  suggested_card_type: CardType;
  confidence: 'needs_confirmation';
  order_index: number;
};
type SplitCandidateRow = { id: string };
type StructuredScheduleItemInput = {
  medicationId: string | null;
  type: ScheduleType;
  title: string;
  dose: string | null;
  unit: string | null;
  scheduledAt: string;
};
type ClinicUpdateClient = CanonicalCareActionWriterClient<CanonicalCareActionRow> & {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  rpc(name: 'mark_first_capture_completed', args: { p_couple_id: string }): Promise<{ data: unknown; error: DbError | null }>;
  from(table: 'clinic_updates'): {
    insert(value: Record<string, unknown>): PromiseLike<{ error: DbError | null }> | { error: DbError | null };
  };
  from(table: 'split_candidates'): {
    insert(rows: SplitCandidateInsertRow[]): { select(columns: 'id'): Promise<{ data: SplitCandidateRow[] | null; error: DbError | null }> };
  };
};

export async function POST(request: NextRequest) {
  const supabase = (await createCookieBackedSupabaseClient()) as unknown as ClinicUpdateClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as {
    sameMedication: boolean | null;
    addedMedicationIds: string[];
    medicationDays: number | null;
    nextVisitAt: string | null;
    triggerPlan: string;
    memo?: string;
    confirmStructured?: boolean;
    structuredPartnerVisible?: boolean;
    newScheduleItems?: StructuredScheduleItemInput[];
  };

  const ambiguousMemo = normalizeMemo(body.memo);
  if (shouldRouteAmbiguousMemoToReview(body, ambiguousMemo)) {
    return createAmbiguousManualMemoReview(request, supabase, ambiguousMemo);
  }

  const structuredItems = normalizeStructuredItems(body.newScheduleItems);
  const hasStructuredPayload = Array.isArray(body.newScheduleItems) && body.newScheduleItems.length > 0;
  if (hasStructuredPayload && structuredItems.length !== body.newScheduleItems?.length) {
    return NextResponse.json({ error: 'valid structured schedule items are required' }, { status: 400 });
  }
  if (hasStructuredPayload) {
    if (body.confirmStructured !== true) {
      return NextResponse.json({ error: 'structured_confirmation_required' }, { status: 409 });
    }
    return createConfirmedStructuredCareActions(request, supabase, user.id, body, structuredItems);
  }

  const { error: updateError } = await supabase
    .from('clinic_updates')
    .insert({
      patient_id: user.id,
      same_medication: body.sameMedication,
      added_medication_ids: body.addedMedicationIds,
      medication_days: body.medicationDays,
      next_visit_at: body.nextVisitAt,
      trigger_plan: body.triggerPlan || null,
      memo: body.memo ?? null,
    });

  if (updateError) {
    if (isMissingSlcTable(updateError)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: maskTechnicalError(updateError.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scheduleItems: [] });
}

async function createConfirmedStructuredCareActions(
  request: NextRequest,
  supabase: ClinicUpdateClient,
  userId: string,
  body: {
    sameMedication: boolean | null;
    addedMedicationIds: string[];
    medicationDays: number | null;
    nextVisitAt: string | null;
    triggerPlan: string;
    memo?: string;
    structuredPartnerVisible?: boolean;
  },
  structuredItems: StructuredScheduleItemInput[],
) {
  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const rawText = buildStructuredVisitInputText(body, structuredItems);
  const capture = await store.createCapture(rawText);
  const partnerVisible = body.structuredPartnerVisible === true;
  const rows: CanonicalCareActionCreate[] = structuredItems.map((item) => ({
    couple_id: store.coupleId,
    created_by: userId,
    source_input_id: capture.visitInputId,
    split_candidate_id: null,
    assignee_role: partnerVisible ? 'both' : 'primary_user',
    card_type: toCareCardType(item.type),
    title: item.title,
    description: formatStructuredDescription(item),
    source_text: structuredSourceText(item),
    scheduled_at: item.scheduledAt,
    status: 'confirmed',
    confirmation_required: false,
    user_marked_important: item.type === 'injection',
    partner_visible: partnerVisible,
  }));

  let cards: CanonicalCareActionRow[];
  try {
    cards = await createConfirmedCareActions(supabase, rows);
  } catch (error) {
    return NextResponse.json({ error: maskTechnicalError(error instanceof Error ? error.message : 'care_action_cards insert failed') }, { status: 500 });
  }

  const { error: captureStateError } = await supabase.rpc('mark_first_capture_completed', { p_couple_id: store.coupleId });
  if (captureStateError) return NextResponse.json({ error: maskTechnicalError(captureStateError.message) }, { status: 500 });

  return NextResponse.json({
    ok: true,
    confirmed: true,
    visitInputId: capture.visitInputId,
    cardItems: cards,
    scheduleItems: cards.map(toSavedScheduleItem),
    legacyScheduleItems: [],
  });
}

async function createAmbiguousManualMemoReview(request: NextRequest, supabase: ClinicUpdateClient, rawText: string) {
  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const capture = await store.createCapture(rawText);
  const rows = splitLines(rawText).map(({ text, offsetStart, offsetEnd }, index): SplitCandidateInsertRow => ({
    couple_id: store.coupleId,
    draft_id: capture.draftId,
    visit_input_id: capture.visitInputId,
    source_text: text,
    source_offset_start: offsetStart,
    source_offset_end: offsetEnd,
    assigned_to: 'my_action',
    suggested_card_type: inferCardType(text, 'my_action'),
    confidence: 'needs_confirmation',
    order_index: index,
  }));

  if (!rows.length) return NextResponse.json({ error: 'memo is required' }, { status: 400 });

  const { data: inserted, error } = await supabase.from('split_candidates').insert(rows).select('id');
  if (error) {
    if (isMissingSlcTable(error)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  }
  if (!inserted || inserted.length !== rows.length) {
    return NextResponse.json({ error: maskTechnicalError('split_candidates insert failed') }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reviewRequired: true,
    visitInputId: capture.visitInputId,
    draftId: capture.draftId,
    candidates: rows.map((row, index) => ({
      id: inserted[index]?.id,
      type: toScheduleType(row.suggested_card_type),
      title: row.source_text,
      scheduled_at: null,
      dose: null,
      unit: null,
    })),
  });
}

function normalizeMemo(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStructuredItems(value: unknown): StructuredScheduleItemInput[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeStructuredItem).filter((item): item is StructuredScheduleItemInput => item !== null);
}

function normalizeStructuredItem(value: unknown): StructuredScheduleItemInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const type = normalizeScheduleType(item.type);
  const title = normalizeMemo(item.title);
  const scheduledAt = normalizeIso(item.scheduledAt);
  if (!type || !title || !scheduledAt) return null;
  return {
    medicationId: typeof item.medicationId === 'string' && item.medicationId.trim() ? item.medicationId.trim() : null,
    type,
    title,
    dose: normalizeNullableText(item.dose),
    unit: normalizeNullableText(item.unit),
    scheduledAt,
  };
}

function normalizeScheduleType(value: unknown): ScheduleType | null {
  return value === 'injection' || value === 'medication' || value === 'clinic' ? value : null;
}

function normalizeNullableText(value: unknown) {
  const text = normalizeMemo(value);
  return text || null;
}

function normalizeIso(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function shouldRouteAmbiguousMemoToReview(
  body: {
    sameMedication: boolean | null;
    addedMedicationIds: string[];
    medicationDays: number | null;
    nextVisitAt: string | null;
    triggerPlan: string;
    newScheduleItems?: unknown[];
  },
  memo: string,
) {
  if (!memo) return false;
  const addedMedicationIds = Array.isArray(body.addedMedicationIds) ? body.addedMedicationIds : [];
  const newScheduleItems = Array.isArray(body.newScheduleItems) ? body.newScheduleItems : [];
  return (
    body.sameMedication === null
    && addedMedicationIds.length === 0
    && body.medicationDays === null
    && !body.nextVisitAt
    && !body.triggerPlan
    && newScheduleItems.length === 0
  );
}

function toScheduleType(cardType: CardType): ScheduleType {
  if (cardType === 'injection' || cardType === 'medication') return cardType;
  return 'clinic';
}

function toCareCardType(type: ScheduleType): CardType {
  if (type === 'clinic') return 'clinic_visit';
  return type;
}

function formatStructuredDescription(item: StructuredScheduleItemInput) {
  if (!item.dose && !item.unit) return null;
  return `${item.dose ?? ''}${item.dose && item.unit ? ' ' : ''}${item.unit ?? ''}`.trim();
}

function structuredSourceText(item: StructuredScheduleItemInput) {
  return [item.title, formatStructuredDescription(item), item.scheduledAt].filter(Boolean).join(' · ');
}

function buildStructuredVisitInputText(
  body: {
    sameMedication: boolean | null;
    addedMedicationIds: string[];
    medicationDays: number | null;
    nextVisitAt: string | null;
    triggerPlan: string;
    memo?: string;
    structuredPartnerVisible?: boolean;
  },
  structuredItems: StructuredScheduleItemInput[],
) {
  return JSON.stringify({
    source: 'clinic_update_structured_confirm',
    sameMedication: body.sameMedication,
    addedMedicationIds: Array.isArray(body.addedMedicationIds) ? body.addedMedicationIds : [],
    medicationDays: body.medicationDays,
    nextVisitAt: body.nextVisitAt,
    triggerPlan: body.triggerPlan || null,
    memo: normalizeMemo(body.memo) || null,
    structuredPartnerVisible: body.structuredPartnerVisible === true,
    items: structuredItems,
  });
}

function toSavedScheduleItem(card: CanonicalCareActionRow) {
  const scheduleType = toScheduleType(card.card_type);
  return {
    id: card.id,
    medicationId: null,
    type: scheduleType,
    title: card.title,
    dose: null,
    unit: null,
    scheduledAt: card.scheduled_at ?? card.care_date ?? new Date().toISOString(),
    source: 'care_action_cards' as const,
  };
}
