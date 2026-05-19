import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../../src/config';
import { PresentationHomeDemo } from '../../../src/features/today/presentation-home-demo';
import { TodayScreen } from '../../../src/features/today/today-screen';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { getKstDayEnd, getKstDayStart } from '../../../src/domain/kst-date';
import { projectCareActionCardsForHome, type CareActionHomeRow } from '../../../src/domain/care-action-home-projection';
import { SLC_FIRST_SCHEDULE_SKIPPED_COOKIE, SLC_ROLE_COOKIE, fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { ClinicUpdate, ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const requestHeaders = await headers();

  if (isPresentationRequest({ headers: requestHeaders })) {
    return <PresentationHomeDemo />;
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

  const homeWindowStart = getKstDayStart(0).toISOString();
  const homeWindowEnd = getKstDayEnd(2).toISOString();

  const [careCardsRes, clinicUpdatesRes] = await Promise.all([
    supabase
      .from('care_action_cards')
      .select('id,couple_id,created_by,assignee_role,card_type,title,description,source_text,scheduled_at,care_date,status,confirmation_required,user_marked_important,partner_visible,revision,created_at')
      .eq('created_by', user.id)
      .in('status', ['confirmed', 'completed'])
      .order('scheduled_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('clinic_updates')
      .select('*')
      .eq('patient_id', user.id)
      .gte('created_at', getKstDayStart(0).toISOString())
      .order('created_at', { ascending: false }),
  ]);

  const careCardItems = careCardsRes.error
    ? []
    : projectCareActionCardsForHome((careCardsRes.data ?? []) as CareActionHomeRow[])
      .filter((item) => {
        const scheduled = new Date(item.scheduled_at).getTime();
        return scheduled >= new Date(homeWindowStart).getTime() && scheduled <= new Date(homeWindowEnd).getTime();
      });

  if (careCardItems.length > 0) {
    return (
      <TodayScreen
        initialItems={careCardItems}
        userId={user.id}
        initialClinicUpdates={(clinicUpdatesRes.data ?? []) as ClinicUpdate[]}
        firstScheduleSkipped={firstScheduleSkipped}
      />
    );
  }

  const itemsRes = await supabase
    .from('schedule_items')
    .select('*')
    .eq('patient_id', user.id)
    .gte('scheduled_at', homeWindowStart)
    .lte('scheduled_at', homeWindowEnd)
    .order('scheduled_at', { ascending: true });

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
