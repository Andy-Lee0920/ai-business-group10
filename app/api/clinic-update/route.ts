import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { maskTechnicalError } from '../../../src/domain/slc-copy';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as {
    sameMedication: boolean;
    addedMedicationIds: string[];
    medicationDays: number;
    nextVisitAt: string;
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
