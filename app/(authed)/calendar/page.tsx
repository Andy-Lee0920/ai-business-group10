import { isPresentationMode } from '../../../src/config';
import { CalendarScreen } from '../../../src/features/calendar/calendar-screen';
import { hasSupabasePublicConfig } from '../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  if (isPresentationMode() && !hasSupabasePublicConfig()) {
    return <CalendarScreen items={fallbackScheduleItems('presentation-user')} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { start, end } = currentMonthRange();
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

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
