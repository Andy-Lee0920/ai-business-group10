import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { CalendarScreen } from '../../../src/features/calendar/calendar-screen';
import { buildPresentationItems } from '../../../src/features/presentation/presentation-testbed';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { CARE_ACTION_SCHEDULE_SELECT, projectCareActionCardsForSchedule, type CareActionScheduleRow } from '../../../src/domain/care-action-home-projection';
import type { ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) return <CalendarScreen items={buildPresentationItems()} />;

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { start, end } = currentMonthRange();
  const careCardsRes = await supabase
    .from('care_action_cards')
    .select(CARE_ACTION_SCHEDULE_SELECT)
    .eq('created_by', user.id)
    .in('status', ['confirmed', 'completed'])
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  const careCardItems = careCardsRes.error
    ? []
    : projectCareActionCardsForSchedule((careCardsRes.data ?? []) as CareActionScheduleRow[])
      .filter((item) => isWithinRange(item.scheduled_at, start, end));
  if (careCardItems.length > 0) return <CalendarScreen items={careCardItems} />;

  const itemsRes = await supabase
    .from('schedule_items')
    .select('*')
    .eq('patient_id', user.id)
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true });

  if (isMissingSlcTable(itemsRes.error)) return <CalendarScreen items={fallbackScheduleItems(user.id)} />;
  if (itemsRes.error) return <CalendarScreen items={[]} />;
  return <CalendarScreen items={(itemsRes.data ?? []) as ScheduleItem[]} />;
}

function isWithinRange(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
