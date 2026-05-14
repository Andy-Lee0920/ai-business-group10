import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationMode } from '../../../src/config';
import { TodayScreen } from '../../../src/features/today/today-screen';
import { hasSupabasePublicConfig } from '../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { ClinicUpdate, PartnerLink, ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (isPresentationMode() && !hasSupabasePublicConfig()) {
    const userId = 'presentation-user';
    return <TodayScreen initialItems={fallbackScheduleItems(userId)} userId={userId} pendingPartnerRequest={null} initialClinicUpdates={[]} />;
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

  if ((isMissingSlcTable(profileError) ? fallbackRole : profile?.role) === 'partner') redirect('/partner');

  const [itemsRes, clinicUpdatesRes, pendingPartnerRequest] = await Promise.all([
    supabase
      .from('schedule_items')
      .select('*')
      .eq('patient_id', user.id)
      .gte('scheduled_at', dayStart(0).toISOString())
      .lte('scheduled_at', dayEnd(2).toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('clinic_updates')
      .select('*')
      .eq('patient_id', user.id)
      .gte('created_at', dayStart(0).toISOString())
      .order('created_at', { ascending: false }),
    getPendingPartnerRequest(supabase, user.id),
  ]);

  if (itemsRes.error) {
    return <TodayScreen initialItems={fallbackScheduleItems(user.id)} userId={user.id} pendingPartnerRequest={pendingPartnerRequest} initialClinicUpdates={[]} />;
  }
  return (
    <TodayScreen
      initialItems={(itemsRes.data ?? []) as ScheduleItem[]}
      userId={user.id}
      pendingPartnerRequest={pendingPartnerRequest}
      initialClinicUpdates={(clinicUpdatesRes.data ?? []) as ClinicUpdate[]}
    />
  );
}

async function getPendingPartnerRequest(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  patientId: string,
): Promise<PartnerLink | null> {
  const { data: request, error } = await supabase
    .from('partner_links')
    .select('*, partner_profile:user_profiles!partner_id(display_name)')
    .eq('patient_id', patientId)
    .eq('status', 'requested')
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return request as PartnerLink | null;
}

function dayStart(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function dayEnd(offset: number) {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + offset);
  return date;
}
