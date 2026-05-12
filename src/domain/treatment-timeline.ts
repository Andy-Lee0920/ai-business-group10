import type { CareActionCard } from '../types/care-cards.types';
import type {
  CareSurfaceContextV2,
  CareSurfaceOverrideReason,
  TimelineCareDay,
  TreatmentMilestone,
  TreatmentMilestoneKind,
} from '../types/treatment-timeline.types';

const PROCEDURE_GATE_PATTERN = /채취|이식|시술|수술|opu|transfer|retrieval/iu;
const TRIGGER_PATTERN = /트리거|오비드렐|ovidrel|데카펩틸|decapeptyl|난포터지는|trigger/iu;

export function computeCareDayV2(
  milestones: readonly TreatmentMilestone[],
  todayCards: readonly CareActionCard[],
  today: string,
): CareSurfaceContextV2 {
  const confirmedCards = todayCards.filter((card) => card.status === 'confirmed');
  const phaseSignal = derivePhaseSignal(milestones, today);
  const phaseCareDay = phaseSignal?.careDay ?? inferFromCards(confirmedCards);
  const override = findSurfaceOverride(confirmedCards);
  const surfaceCareDay = override?.careDay ?? phaseCareDay;

  return {
    phaseCareDay,
    surfaceCareDay,
    foregroundCards: rankForegroundCards(confirmedCards),
    overrideReason: override?.reason ?? 'none',
    proximityDays: phaseSignal?.proximityDays,
  };
}

function derivePhaseSignal(milestones: readonly TreatmentMilestone[], today: string): { careDay: TimelineCareDay; proximityDays: number } | null {
  const active = milestones
    .filter((milestone) => milestone.confirmed_at <= today)
    .sort((left, right) => right.confirmed_at.localeCompare(left.confirmed_at))[0];

  if (!active) return null;
  const proximityDays = daysBetween(active.confirmed_at, today);
  return { careDay: phaseForMilestone(active.milestone, proximityDays), proximityDays };
}

function phaseForMilestone(kind: TreatmentMilestoneKind, daysSince: number): TimelineCareDay {
  if (kind === 'stimulation_start' || kind === 'trigger_shot') return 'injection_day';
  if (kind === 'egg_retrieval') return daysSince === 0 ? 'clinic_day' : 'waiting_day';
  if (kind === 'embryo_transfer') return daysSince === 0 ? 'clinic_day' : 'waiting_day';
  if (kind === 'result_day') return daysSince === 0 ? 'clinic_day' : 'routine_day';
  return 'routine_day';
}

function daysBetween(start: string, end: string) {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return Math.max(0, Math.round((endMs - startMs) / 86_400_000));
}

function findSurfaceOverride(cards: readonly CareActionCard[]): { careDay: TimelineCareDay; reason: Exclude<CareSurfaceOverrideReason, 'none'> } | null {
  const trigger = cards.find((card) => card.card_type === 'injection' && TRIGGER_PATTERN.test(`${card.title} ${card.description ?? ''} ${card.source_text}`));
  if (trigger) return { careDay: 'injection_day', reason: 'trigger_shot' };

  const procedure = cards.find((card) => card.card_type === 'clinic_visit' && PROCEDURE_GATE_PATTERN.test(`${card.title} ${card.description ?? ''} ${card.source_text}`));
  if (procedure) return { careDay: 'clinic_day', reason: 'procedure_time_gate' };

  return null;
}

function inferFromCards(cards: readonly CareActionCard[]): TimelineCareDay {
  if (cards.some((card) => card.card_type === 'injection')) return 'injection_day';
  if (cards.some((card) => card.card_type === 'clinic_visit')) return 'clinic_day';
  if (cards.length > 0) return 'routine_day';
  return 'routine_day';
}

function rankForegroundCards(cards: readonly CareActionCard[]) {
  return [...cards].sort((left, right) => cardRank(right) - cardRank(left) || timeRank(left) - timeRank(right));
}

function cardRank(card: CareActionCard) {
  if (card.card_type === 'injection' && TRIGGER_PATTERN.test(`${card.title} ${card.description ?? ''} ${card.source_text}`)) return 40;
  if (card.card_type === 'clinic_visit' && PROCEDURE_GATE_PATTERN.test(`${card.title} ${card.description ?? ''} ${card.source_text}`)) return 35;
  if (card.card_type === 'injection') return 30;
  if (card.user_marked_important) return 20;
  if (card.card_type === 'clinic_visit') return 10;
  return 0;
}

function timeRank(card: CareActionCard) {
  return card.scheduled_at ? new Date(card.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
}
