import { NextResponse, type NextRequest } from 'next/server';
import { splitLines, inferCardType } from '../../../src/domain/line-split';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { createCaptureStore } from '../../../src/lib/capture-confirm-store';
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
type ClinicUpdateClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  from(table: 'clinic_updates'): {
    insert(value: Record<string, unknown>): PromiseLike<{ error: DbError | null }> | { error: DbError | null };
  };
  from(table: 'schedule_items'): {
    insert(value: Array<Record<string, unknown>>): PromiseLike<{ error: DbError | null }> | { error: DbError | null };
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
    newScheduleItems?: Array<{
      medicationId: string | null;
      type: 'injection' | 'medication' | 'clinic';
      title: string;
      dose: string | null;
      unit: string | null;
      scheduledAt: string;
    }>;
  };

  const ambiguousMemo = normalizeMemo(body.memo);
  if (shouldRouteAmbiguousMemoToReview(body, ambiguousMemo)) {
    return createAmbiguousManualMemoReview(request, supabase, ambiguousMemo);
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

  if (body.newScheduleItems?.length) {
    const items = body.newScheduleItems.map((item) => ({
      patient_id: user.id,
      medication_id: item.medicationId,
      type: item.type,
      title: item.title,
      dose: item.dose,
      unit: item.unit,
      scheduled_at: item.scheduledAt,
      source: 'clinic_update' as const,
    }));
    const { error: scheduleError } = await supabase.from('schedule_items').insert(items);
    if (scheduleError) {
      if (isMissingSlcTable(scheduleError)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
      return NextResponse.json({ error: maskTechnicalError(scheduleError.message) }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, scheduleItems: body.newScheduleItems ?? [] });
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
