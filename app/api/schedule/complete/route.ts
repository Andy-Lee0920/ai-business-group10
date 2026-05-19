import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../../src/lib/slc-fallback';
import type { InjectionSite } from '../../../../src/types/slc.types';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as { scheduleItemId: string; injectionSite?: InjectionSite };
  const { scheduleItemId, injectionSite } = body;
  const completedAt = new Date().toISOString();

  const careCardResult = await supabase
    .from('care_action_cards')
    .update({ status: 'completed', completed_at: completedAt, updated_at: completedAt })
    .eq('id', scheduleItemId)
    .eq('created_by', user.id)
    .select('id')
    .maybeSingle();

  if (careCardResult.error) {
    if (!isMissingSlcTable(careCardResult.error)) {
      return NextResponse.json({ error: maskTechnicalError(careCardResult.error.message) }, { status: 500 });
    }
  } else if (careCardResult.data) {
    return NextResponse.json({ ok: true, source: 'care_action_cards' });
  }

  const { error: updateError } = await supabase
    .from('schedule_items')
    .update({ status: 'completed', updated_at: completedAt })
    .eq('id', scheduleItemId)
    .eq('patient_id', user.id);

  if (updateError) {
    if (isMissingSlcTable(updateError)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: maskTechnicalError(updateError.message) }, { status: 500 });
  }

  const { error: recordError } = await supabase
    .from('completion_records')
    .insert({
      schedule_item_id: scheduleItemId,
      patient_id: user.id,
      completed_at: completedAt,
      injection_site: injectionSite ?? null,
    });

  if (recordError) {
    if (isMissingSlcTable(recordError)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: maskTechnicalError(recordError.message) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
