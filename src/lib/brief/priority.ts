export type BriefPriorityCard = {
  id: string;
  scheduled_at: string | null;
  status: string;
};

export type HeroSurface = 'brief' | 'execution';
export type HeroOverrideReason = 'none' | 'overdue' | 'within_15m' | 'within_60m';

export type HeroPriority = {
  heroSurface: HeroSurface;
  overrideReason: HeroOverrideReason;
  proximityMinutes: number | null;
  cardId: string | null;
};

export function pickHeroSurface({ now, cards }: { now: Date; cards: readonly BriefPriorityCard[] }): HeroPriority {
  const candidate = cards
    .filter((card) => card.status !== 'completed' && card.scheduled_at)
    .map((card) => ({ card, minutes: minutesUntil(now, card.scheduled_at ?? '') }))
    .filter(({ minutes }) => minutes <= 60)
    .sort((left, right) => Math.abs(left.minutes) - Math.abs(right.minutes))[0];

  if (!candidate) return basePriority();
  if (candidate.minutes < 0) return executionPriority('overdue', candidate);
  if (candidate.minutes <= 15) return executionPriority('within_15m', candidate);
  return executionPriority('within_60m', candidate);
}

function minutesUntil(now: Date, scheduledAt: string) {
  return Math.ceil((new Date(scheduledAt).getTime() - now.getTime()) / 60_000);
}

function basePriority(): HeroPriority {
  return { heroSurface: 'brief', overrideReason: 'none', proximityMinutes: null, cardId: null };
}

function executionPriority(reason: Exclude<HeroOverrideReason, 'none'>, value: { card: BriefPriorityCard; minutes: number }): HeroPriority {
  return { heroSurface: 'execution', overrideReason: reason, proximityMinutes: value.minutes, cardId: value.card.id };
}
