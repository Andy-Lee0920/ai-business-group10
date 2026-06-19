import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../config';
import { getKstDayEnd, getKstDayStart } from '../../domain/kst-date';
import { mergeCanonicalScheduleItemsWithLegacyFallback, projectCareActionCardsForHome, type CareActionHomeRow } from '../../domain/care-action-home-projection';
import { careDayForConfirmedPhase } from '../../domain/cycle-state-machine';
import { factDict } from '../../lib/brief/factDict';
import { generateDailyBrief } from '../../lib/brief/generateBrief';
import { FEVIO_JUNE_TEST_SEED_COOKIE, isJuneTestScheduleSeedEnabled, mergeJuneTestScheduleItems } from '../../lib/june-test-schedule-seed';
import { createCookieBackedSupabaseClient } from '../../lib/server-supabase';
import { SLC_FIRST_SCHEDULE_SKIPPED_COOKIE, SLC_ROLE_COOKIE, fallbackScheduleItems, isMissingSlcTable } from '../../lib/slc-fallback';
import type { ClinicUpdate, ScheduleItem } from '../../types/slc.types';
import type { IvfPhase } from '../../types/cycle-event.types';
import {
  AdaptiveHomeDemo,
  getAdaptiveHomeDemoCare,
  hasAdaptiveHomeDemoParam,
  type AdaptiveHomeDemoParams,
} from './adaptive-home-demo';
import { TodayScreen } from './today-screen';

export type HomeDataSource = { kind: 'fixture' } | { kind: 'supabase' };

export async function resolveHomeDataSource(): Promise<HomeDataSource> {
  const requestHeaders = await headers();
  return isPresentationRequest({ headers: requestHeaders }) ? { kind: 'fixture' } : { kind: 'supabase' };
}

export async function renderHomePage(searchParams?: AdaptiveHomeDemoParams) {
  const source = await resolveHomeDataSource();
  if (source.kind === 'fixture') return <AdaptiveHomeDemo care={getAdaptiveHomeDemoCare(searchParams)} />;
  return renderSupabaseHomePage(searchParams);
}

async function renderSupabaseHomePage(searchParams?: AdaptiveHomeDemoParams) {
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
  const juneTestSeedEnabled = isJuneTestScheduleSeedEnabled(cookieStore.get(FEVIO_JUNE_TEST_SEED_COOKIE)?.value);

  if ((isMissingSlcTable(profileError) ? fallbackRole : profile?.role) === 'partner') redirect('/partner');

  if (juneTestSeedEnabled || hasAdaptiveHomeDemoParam(searchParams)) {
    return <AdaptiveHomeDemo care={getAdaptiveHomeDemoCare(searchParams)} />;
  }

  const homeWindowStart = getKstDayStart(0).toISOString();
  const homeWindowEnd = getKstDayEnd(2).toISOString();

  const [careCardsRes, clinicUpdatesRes, itemsRes] = await Promise.all([
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
    supabase
      .from('schedule_items')
      .select('*')
      .eq('patient_id', user.id)
      .gte('scheduled_at', homeWindowStart)
      .lte('scheduled_at', homeWindowEnd)
      .order('scheduled_at', { ascending: true }),
  ]);

  const careCardItems = careCardsRes.error
    ? []
    : projectCareActionCardsForHome((careCardsRes.data ?? []) as CareActionHomeRow[])
      .filter((item) => {
        const scheduled = new Date(item.scheduled_at).getTime();
        return scheduled >= new Date(homeWindowStart).getTime() && scheduled <= new Date(homeWindowEnd).getTime();
      });

  const legacyItems = itemsRes.error ? [] : (itemsRes.data ?? []) as ScheduleItem[];
  const mergedItems = mergeCanonicalScheduleItemsWithLegacyFallback(careCardItems, legacyItems);

  if (itemsRes.error && mergedItems.length === 0) {
    const fallbackItems = mergeJuneTestScheduleItems(fallbackScheduleItems(user.id), user.id, juneTestSeedEnabled);
    const dailyBrief = await buildHomeBrief(fallbackItems);
    return <TodayScreen dailyBrief={dailyBrief.line} initialItems={fallbackItems} userId={user.id} initialClinicUpdates={[]} />;
  }

  const seededItems = mergeJuneTestScheduleItems(mergedItems, user.id, juneTestSeedEnabled);
  const dailyBrief = await buildHomeBrief(seededItems);
  return (
    <TodayScreen
      dailyBrief={dailyBrief.line}
      initialItems={seededItems}
      userId={user.id}
      initialClinicUpdates={(clinicUpdatesRes.data ?? []) as ClinicUpdate[]}
      firstScheduleSkipped={firstScheduleSkipped}
    />
  );
}

function inferBriefPhase(items: readonly ScheduleItem[]): IvfPhase | 'onboarding' {
  if (items.length === 0) return 'onboarding';
  if (items.some((item) => item.type === 'injection')) return 'stimulation';
  if (items.some((item) => item.type === 'clinic')) return 'follicle_monitoring';
  return 'consultation';
}

async function buildHomeBrief(items: readonly ScheduleItem[]) {
  const confirmedPhase = inferBriefPhase(items);
  const phaseCareDay = confirmedPhase === 'onboarding' ? 'onboarding' : careDayForConfirmedPhase(confirmedPhase);
  return generateDailyBrief({
    confirmedPhase,
    phaseCareDay,
    dayIndexInPhase: 0,
    facts: factDict[confirmedPhase],
    recentCriticalEventTypes: [],
  });
}
