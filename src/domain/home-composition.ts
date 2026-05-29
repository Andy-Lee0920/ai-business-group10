import { computeCareDay, computeDisplaySafetyLevel, computeReminderFallbackState, reminderFallbackCopy } from './care-cards';
import { computeCareDayV2 } from './treatment-timeline';
import type { CareActionCard, CareDay, DisplaySafetyLevel } from '../types/care-cards.types';
import type { IvfPhase } from '../types/cycle-event.types';
import type { RoleBasedHomeIntent } from './care-os-architecture';
import type { CareSurfaceOverrideReason, TimelineCareDay, TreatmentMilestone, TreatmentMilestoneKind } from '../types/treatment-timeline.types';

export type HomeActionCard = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  cardType: CareActionCard['card_type'];
  displaySafetyLevel: DisplaySafetyLevel;
  accentClassName: string;
  urgencyCopy: string | null;
};

export type HomeContext = {
  careDay: CareDay;
  phaseCareDay?: TimelineCareDay;
  surfaceCareDay?: TimelineCareDay;
  overrideReason?: CareSurfaceOverrideReason;
  proximityDays?: number;
  generatedAt: string;
  primaryMessage: string;
  cards: HomeActionCard[];
  roleIntent?: RoleBasedHomeIntent;
  onboardingQuickCaptureDone?: boolean;
  partnerConnected?: boolean;
};

export type HomeBriefPhase = IvfPhase | 'onboarding';

export type HomeBriefContext = {
  confirmedPhase: HomeBriefPhase;
  phaseCareDay: TimelineCareDay | 'onboarding';
  dayIndexInPhase: number;
};

export function computeHomeContext(cards: readonly CareActionCard[], now: Date): HomeContext {
  const confirmedCards = cards.filter((card) => card.status === 'confirmed');
  const careDay = computeCareDay({ hasEverCaptured: cards.length > 0, cards: confirmedCards, now });

  return {
    careDay,
    generatedAt: now.toISOString(),
    primaryMessage: getPrimaryMessage(careDay),
    cards: confirmedCards.map((card) => toHomeActionCard(card, now)).sort(compareHomeCards),
  };
}

export function computeHomeContextV2(
  cards: readonly CareActionCard[],
  milestones: readonly TreatmentMilestone[],
  now: Date,
): HomeContext {
  const confirmedCards = cards.filter((card) => card.status === 'confirmed');
  const today = now.toISOString().slice(0, 10);
  const surface = computeCareDayV2(milestones, confirmedCards.filter((card) => isCardOnIsoDay(card, today)), today);

  return {
    careDay: surface.surfaceCareDay,
    phaseCareDay: surface.phaseCareDay,
    surfaceCareDay: surface.surfaceCareDay,
    overrideReason: surface.overrideReason,
    proximityDays: surface.proximityDays,
    generatedAt: now.toISOString(),
    primaryMessage: getPrimaryMessage(surface.surfaceCareDay),
    cards: surface.foregroundCards.map((card) => toHomeActionCard(card, now)).sort(compareHomeCards),
  };
}

export function deriveHomeBriefContext(
  context: Pick<HomeContext, 'careDay' | 'phaseCareDay' | 'proximityDays'>,
  milestones: readonly TreatmentMilestone[],
  now: Date,
): HomeBriefContext {
  if (context.careDay === 'onboarding') {
    return { confirmedPhase: 'onboarding', phaseCareDay: 'onboarding', dayIndexInPhase: 0 };
  }

  const today = now.toISOString().slice(0, 10);
  const activeMilestone = findActiveMilestone(milestones, today);
  if (activeMilestone) {
    const dayIndexInPhase = daysBetween(activeMilestone.confirmed_at, today);
    return {
      confirmedPhase: briefPhaseForMilestone(activeMilestone.milestone, dayIndexInPhase),
      phaseCareDay: context.phaseCareDay ?? context.careDay,
      dayIndexInPhase,
    };
  }

  return {
    confirmedPhase: briefPhaseForCareDay(context.phaseCareDay ?? context.careDay),
    phaseCareDay: context.phaseCareDay ?? context.careDay,
    dayIndexInPhase: context.proximityDays ?? 0,
  };
}

function findActiveMilestone(milestones: readonly TreatmentMilestone[], today: string): TreatmentMilestone | null {
  return milestones
    .filter((milestone) => milestone.confirmed_at <= today)
    .sort((left, right) => right.confirmed_at.localeCompare(left.confirmed_at))[0] ?? null;
}

function briefPhaseForMilestone(kind: TreatmentMilestoneKind, daysSince: number): IvfPhase {
  if (kind === 'initial_visit') return 'consultation';
  if (kind === 'stimulation_start') return 'stimulation';
  if (kind === 'trigger_shot') return 'trigger_wait';
  if (kind === 'egg_retrieval') return daysSince === 0 ? 'retrieval_scheduled' : 'retrieval_done';
  if (kind === 'embryo_transfer') return daysSince === 0 ? 'transfer_scheduled' : 'two_week_wait';
  if (kind === 'result_day') return daysSince === 0 ? 'beta_wait' : 'result_protection';
  return 'consultation';
}

function briefPhaseForCareDay(careDay: CareDay): IvfPhase {
  if (careDay === 'injection_day') return 'stimulation';
  if (careDay === 'clinic_day') return 'follicle_monitoring';
  if (careDay === 'two_week_wait_day') return 'two_week_wait';
  if (careDay === 'result_protection_day') return 'result_protection';
  return 'consultation';
}

function isCardOnIsoDay(card: CareActionCard, today: string) {
  if (card.care_date === today) return true;
  return card.scheduled_at?.slice(0, 10) === today;
}

function toHomeActionCard(card: CareActionCard, now: Date): HomeActionCard {
  const displaySafetyLevel = computeDisplaySafetyLevel(card, now);
  const recheckCopy = reminderFallbackCopy(computeReminderFallbackState(card, now));

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    scheduledAt: card.scheduled_at,
    cardType: card.card_type,
    displaySafetyLevel,
    accentClassName: displaySafetyLevel === 'critical' ? 'home-card--critical home-card--coral' : 'home-card--calm',
    urgencyCopy: recheckCopy ?? (displaySafetyLevel === 'critical' ? '시간 다 됐어요 · 지금 ±30분' : null),
  };
}

function compareHomeCards(left: HomeActionCard, right: HomeActionCard) {
  const levelDelta = safetyRank(right.displaySafetyLevel) - safetyRank(left.displaySafetyLevel);
  if (levelDelta !== 0) return levelDelta;

  return timeRank(left.scheduledAt) - timeRank(right.scheduledAt);
}

function safetyRank(level: DisplaySafetyLevel) {
  if (level === 'critical') return 2;
  if (level === 'time_sensitive') return 1;
  return 0;
}

function timeRank(value: string | null) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function daysBetween(start: string, end: string) {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return Math.max(0, Math.round((endMs - startMs) / 86_400_000));
}

function getPrimaryMessage(careDay: CareDay) {
  if (careDay === 'onboarding') return '오늘 필요한 케어를 먼저 정리해요.';
  if (careDay === 'injection_day') return '오늘은 시간과 준비물이 흔들리지 않도록, 확인한 내용만 먼저 놓을게요.';
  if (careDay === 'clinic_day') return '방문 전에는 지난 흐름과 다음 안내를 한 번에 차분히 확인해요.';
  if (careDay === 'waiting_day') return '오늘은 더 많이 확인하기보다, 필요한 일정만 조용히 붙잡아 둘게요.';
  if (careDay === 'two_week_wait_day') return '피검 전까지는 기록은 남기고 판단은 잠시 미뤄둘게요.';
  if (careDay === 'result_protection_day') return '오늘은 아무것도 결정하지 않아도 됩니다. 필요한 알림만 조용히 남겨둘게요.';
  return '오늘 해야 할 것과 쉬어도 되는 것을 나눠서 보여드릴게요.';
}
