import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../config';
import { getKstDayEnd, getKstDayStart } from '../../domain/kst-date';
import {
  filterLegacyTodayItemsForHomeWindow,
  projectCareActionCardsToLegacyTodayItems,
  type CareActionHomeRow,
  type LegacyHomeScheduleItem,
} from '../../domain/care-action-home-projection';
import { computeHomeContextV2, deriveHomeBriefContext, type HomeContext } from '../../domain/home-composition';
import { careDayForConfirmedPhase } from '../../domain/cycle-state-machine';
import { factDict } from '../../lib/brief/factDict';
import { generateDailyBrief } from '../../lib/brief/generateBrief';
import { createCookieBackedSupabaseClient } from '../../lib/server-supabase';
import { SLC_FIRST_SCHEDULE_SKIPPED_COOKIE, SLC_ROLE_COOKIE, fallbackScheduleItems, isMissingSlcTable } from '../../lib/slc-fallback';
import type { ClinicUpdate, ScheduleItem } from '../../types/slc.types';
import type { IvfPhase } from '../../types/cycle-event.types';
import type { TreatmentMilestone } from '../../types/treatment-timeline.types';
import { PresentationHomeDemo } from './presentation-home-demo';
import { TodayScreen } from './today-screen';

export type HomeDataSource = { kind: 'fixture' } | { kind: 'supabase' };

type HomeSupabaseClient = Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>;
type CoupleMemberHomeRow = { couple_id: string | null };

export async function resolveHomeDataSource(): Promise<HomeDataSource> {
  const requestHeaders = await headers();
  return isPresentationRequest({ headers: requestHeaders }) ? { kind: 'fixture' } : { kind: 'supabase' };
}

export async function renderHomePage() {
  const source = await resolveHomeDataSource();
  if (source.kind === 'fixture') return <PresentationHomeDemo />;
  return renderSupabaseHomePage();
}

async function renderSupabaseHomePage() {
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

  const now = new Date();
  const homeWindowStart = getKstDayStart(0).toISOString();
  const homeWindowEnd = getKstDayEnd(2).toISOString();

  const [careCardsRes, clinicUpdatesRes, coupleMemberRes] = await Promise.all([
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
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const canonicalCareRows = careCardsRes.error ? [] : ((careCardsRes.data ?? []) as CareActionHomeRow[]);
  const coupleId = resolveHomeCoupleId(coupleMemberRes.data as CoupleMemberHomeRow | null, canonicalCareRows);
  const milestones = await readTreatmentMilestonesForHome(supabase, coupleId);
  const canonicalHomeContext = canonicalCareRows.length > 0 || milestones.length > 0
    ? computeHomeContextV2(canonicalCareRows, milestones, now)
    : null;
  const careCardItems = filterLegacyTodayItemsForHomeWindow(
    projectCareActionCardsToLegacyTodayItems(canonicalCareRows),
    homeWindowStart,
    homeWindowEnd,
  );

  if (careCardItems.length > 0) {
    const dailyBrief = await buildHomeBriefFromCanonicalContext(canonicalHomeContext, milestones, now);
    return (
      <TodayScreen
        dailyBrief={dailyBrief.line}
        initialItems={careCardItems}
        userId={user.id}
        initialClinicUpdates={(clinicUpdatesRes.data ?? []) as ClinicUpdate[]}
        firstScheduleSkipped={firstScheduleSkipped}
      />
    );
  }

  const legacyItems = await readLegacyScheduleItemsFallback(supabase, user.id, homeWindowStart, homeWindowEnd);

  if (!legacyItems) {
    const fallbackItems = fallbackScheduleItems(user.id);
    const dailyBrief = canonicalHomeContext
      ? await buildHomeBriefFromCanonicalContext(canonicalHomeContext, milestones, now)
      : await buildHomeBriefFromLegacyItems(fallbackItems);
    return <TodayScreen dailyBrief={dailyBrief.line} initialItems={fallbackItems} userId={user.id} initialClinicUpdates={[]} />;
  }

  const dailyBrief = canonicalHomeContext
    ? await buildHomeBriefFromCanonicalContext(canonicalHomeContext, milestones, now)
    : await buildHomeBriefFromLegacyItems(legacyItems);
  return (
    <TodayScreen
      dailyBrief={dailyBrief.line}
      initialItems={legacyItems}
      userId={user.id}
      initialClinicUpdates={(clinicUpdatesRes.data ?? []) as ClinicUpdate[]}
      firstScheduleSkipped={firstScheduleSkipped}
    />
  );
}

function resolveHomeCoupleId(member: CoupleMemberHomeRow | null, cards: readonly CareActionHomeRow[]): string | null {
  if (typeof member?.couple_id === 'string') return member.couple_id;
  return cards.find((card) => typeof card.couple_id === 'string')?.couple_id ?? null;
}

async function readTreatmentMilestonesForHome(supabase: HomeSupabaseClient, coupleId: string | null): Promise<TreatmentMilestone[]> {
  if (!coupleId) return [];
  const result = await supabase
    .from('treatment_milestones')
    .select('id,cycle_id,couple_id,milestone,confirmed_at,notes,created_at')
    .eq('couple_id', coupleId)
    .order('confirmed_at', { ascending: false });

  if (result.error) return [];
  return (result.data ?? []) as TreatmentMilestone[];
}

async function readLegacyScheduleItemsFallback(
  supabase: HomeSupabaseClient,
  userId: string,
  homeWindowStart: string,
  homeWindowEnd: string,
): Promise<LegacyHomeScheduleItem[] | null> {
  const result = await supabase
    .from('schedule_items')
    .select('*')
    .eq('patient_id', userId)
    .gte('scheduled_at', homeWindowStart)
    .lte('scheduled_at', homeWindowEnd)
    .order('scheduled_at', { ascending: true });

  if (result.error) return null;
  return (result.data ?? []) as ScheduleItem[];
}

function inferBriefPhase(items: readonly ScheduleItem[]): IvfPhase | 'onboarding' {
  if (items.length === 0) return 'onboarding';
  if (items.some((item) => item.type === 'injection')) return 'stimulation';
  if (items.some((item) => item.type === 'clinic')) return 'follicle_monitoring';
  return 'consultation';
}

async function buildHomeBriefFromLegacyItems(items: readonly ScheduleItem[]) {
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

async function buildHomeBriefFromCanonicalContext(
  context: HomeContext | null,
  milestones: readonly TreatmentMilestone[],
  now: Date,
) {
  if (!context) return buildHomeBriefFromLegacyItems([]);
  const briefContext = deriveHomeBriefContext(context, milestones, now);
  return generateDailyBrief({
    confirmedPhase: briefContext.confirmedPhase,
    phaseCareDay: briefContext.phaseCareDay,
    dayIndexInPhase: briefContext.dayIndexInPhase,
    facts: factDict[briefContext.confirmedPhase],
    recentCriticalEventTypes: [],
  });
}
