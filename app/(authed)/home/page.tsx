import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationMode } from '../../../src/config';
import { TodayScreen } from '../../../src/features/today/today-screen';
import { hasSupabasePublicConfig } from '../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { getKstDayEnd, getKstDayStart } from '../../../src/domain/kst-date';
import { SLC_FIRST_SCHEDULE_SKIPPED_COOKIE, SLC_ROLE_COOKIE, fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { ClinicUpdate, ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (isPresentationMode() && !hasSupabasePublicConfig()) {
    const userId = 'presentation-user';
    return <TodayScreen initialItems={fallbackScheduleItems(userId)} userId={userId} initialClinicUpdates={[]} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const cookieStore = await cookies();
  const fallbackRole = cookieStore.get(SLC_ROLE_COOKIE)?.value;
  const firstScheduleSkipped = cookieStore.get(SLC_FIRST_SCHEDULE_SKIPPED_COOKIE)?.value === '1';

  if ((isMissingSlcTable(profileError) ? fallbackRole : profile?.role) === 'partner') redirect('/partner');

  const [itemsRes, clinicUpdatesRes] = await Promise.all([
    supabase
      .from('schedule_items')
      .select('*')
      .eq('patient_id', user.id)
      .gte('scheduled_at', getKstDayStart(0).toISOString())
      .lte('scheduled_at', getKstDayEnd(2).toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('clinic_updates')
      .select('*')
      .eq('patient_id', user.id)
      .gte('created_at', getKstDayStart(0).toISOString())
      .order('created_at', { ascending: false }),
  ]);

  if (itemsRes.error) {
    return <TodayScreen initialItems={fallbackScheduleItems(user.id)} userId={user.id} initialClinicUpdates={[]} />;
  }
  return (
    <TodayScreen
      initialItems={(itemsRes.data ?? []) as ScheduleItem[]}
      userId={user.id}
      initialClinicUpdates={(clinicUpdatesRes.data ?? []) as ClinicUpdate[]}
      firstScheduleSkipped={firstScheduleSkipped}
    />
  );
}
