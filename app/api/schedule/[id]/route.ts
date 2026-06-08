import { NextResponse, type NextRequest } from 'next/server';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';
import {
  CARE_ACTION_SCHEDULE_SELECT,
  careDateFromScheduledAt,
  projectCareActionCardForSchedule,
  scheduleTypeToCareCardType,
  type CareActionScheduleRow,
} from '../../../../src/domain/care-action-home-projection';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../../src/lib/slc-fallback';
import type { ScheduleItem, ScheduleType } from '../../../../src/types/slc.types';

type ScheduleUpdateBody = {
  type?: unknown;
  title?: unknown;
  dose?: unknown;
  unit?: unknown;
  scheduledAt?: unknown;
  medicationId?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const input = normalizeScheduleUpdate((await request.json().catch(() => ({}))) as ScheduleUpdateBody);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = new Date().toISOString();
  const { data: careCard, error: careCardError } = await supabase
    .from('care_action_cards')
    .update({
      card_type: scheduleTypeToCareCardType(input.type),
      title: input.title,
      description: formatScheduleDescription(input.dose, input.unit),
      scheduled_at: input.scheduledAt,
      care_date: careDateFromScheduledAt(input.scheduledAt),
      updated_at: now,
    })
    .eq('id', id)
    .eq('created_by', user.id)
    .select(CARE_ACTION_SCHEDULE_SELECT)
    .maybeSingle<CareActionScheduleRow>();

  const projectedCareCard = careCard ? projectCareActionCardForSchedule(careCard) : null;
  if (projectedCareCard) return NextResponse.json({ item: projectedCareCard, source: 'care_action_cards' });
  if (careCardError && !isMissingSlcTable(careCardError)) return NextResponse.json({ error: maskTechnicalError(careCardError.message) }, { status: 500 });

  // Legacy compatibility fallback: old schedule rows remain editable until Slice 5 disposition.
  const { data, error } = await supabase
    .from('schedule_items')
    .update({
      type: input.type,
      title: input.title,
      dose: input.dose,
      unit: input.unit,
      scheduled_at: input.scheduledAt,
      medication_id: input.medicationId,
      updated_at: now,
    })
    .eq('id', id)
    .eq('patient_id', user.id)
    .select('*')
    .single<ScheduleItem>();

  if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  return NextResponse.json({ item: data, source: 'legacy_schedule_items' });
}

function normalizeScheduleUpdate(body: ScheduleUpdateBody):
  | { type: ScheduleType; title: string; dose: string | null; unit: string | null; scheduledAt: string; medicationId: string | null }
  | { error: string } {
  const type = body.type === 'injection' || body.type === 'medication' || body.type === 'clinic' ? body.type : null;
  const title = normalizeText(body.title);
  const scheduledAtText = normalizeText(body.scheduledAt);
  const scheduledAt = scheduledAtText ? new Date(scheduledAtText) : null;

  if (!type) return { error: '일정 종류를 다시 선택해 주세요.' };
  if (!title) return { error: '일정 이름을 입력해 주세요.' };
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return { error: '일정 시간을 다시 확인해 주세요.' };

  return {
    type,
    title,
    dose: normalizeNullableText(body.dose),
    unit: normalizeNullableText(body.unit),
    scheduledAt: scheduledAt.toISOString(),
    medicationId: normalizeNullableText(body.medicationId),
  };
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = new Date().toISOString();
  const { data: careCard, error: careCardError } = await supabase
    .from('care_action_cards')
    .update({ status: 'archived', updated_at: now })
    .eq('id', id)
    .eq('created_by', user.id)
    .select('id')
    .maybeSingle<{ id: string }>();

  if (careCard) return NextResponse.json({ ok: true, source: 'care_action_cards' });
  if (careCardError && !isMissingSlcTable(careCardError)) return NextResponse.json({ error: maskTechnicalError(careCardError.message) }, { status: 500 });

  // Legacy compatibility fallback: delete old schedule rows while schedule_items still exists.
  const { error } = await supabase
    .from('schedule_items')
    .delete()
    .eq('id', id)
    .eq('patient_id', user.id);

  if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'legacy_schedule_items' });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function formatScheduleDescription(dose: string | null, unit: string | null) {
  const description = [dose, unit].filter(Boolean).join(' ').trim();
  return description || null;
}
