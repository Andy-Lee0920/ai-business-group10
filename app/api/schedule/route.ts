import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { ScheduleItem } from '../../../src/types/slc.types';
import { maskTechnicalError } from '../../../src/domain/slc-copy';
import { CARE_ACTION_SCHEDULE_SELECT, mergeCanonicalScheduleItemsWithLegacyFallback, projectCareActionCardsForSchedule, type CareActionScheduleRow } from '../../../src/domain/care-action-home-projection';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const careCardsRes = await supabase
    .from('care_action_cards')
    .select(CARE_ACTION_SCHEDULE_SELECT)
    .eq('created_by', user.id)
    .in('status', ['confirmed', 'completed'])
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  const careCardItems = careCardsRes.error
    ? []
    : projectCareActionCardsForSchedule((careCardsRes.data ?? []) as CareActionScheduleRow[])
      .filter((item) => isWithinRange(item.scheduled_at, todayStart, todayEnd));

  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('patient_id', user.id)
    .gte('scheduled_at', todayStart.toISOString())
    .lte('scheduled_at', todayEnd.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    if (careCardItems.length > 0) return NextResponse.json({ items: careCardItems, source: 'care_action_cards' });
    return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  }

  const items = mergeCanonicalScheduleItemsWithLegacyFallback(careCardItems, (data ?? []) as ScheduleItem[]);
  return NextResponse.json({ items, source: careCardItems.length > 0 ? 'care_action_cards' : 'legacy_schedule_items' });
}

function isWithinRange(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}
