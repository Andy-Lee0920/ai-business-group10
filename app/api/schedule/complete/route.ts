import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../../src/lib/slc-fallback';
import type { InjectionSite } from '../../../../src/types/slc.types';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as { scheduleItemId: string; injectionSite?: InjectionSite };
  const { scheduleItemId, injectionSite } = body;

  const { error: updateError } = await supabase
    .from('schedule_items')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', scheduleItemId)
    .eq('patient_id', user.id);

  if (updateError) {
    if (isMissingSlcTable(updateError)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: recordError } = await supabase
    .from('completion_records')
    .insert({
      schedule_item_id: scheduleItemId,
      patient_id: user.id,
      completed_at: new Date().toISOString(),
      injection_site: injectionSite ?? null,
    });

  if (recordError) {
    if (isMissingSlcTable(recordError)) return NextResponse.json({ ok: true, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
