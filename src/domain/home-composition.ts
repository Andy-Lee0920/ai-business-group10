import { computeCareDay, computeDisplaySafetyLevel, computeReminderFallbackState, reminderFallbackCopy } from './care-cards';
import type { CareActionCard, CareDay, DisplaySafetyLevel } from '../types/care-cards.types';

export type HomeActionCard = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  displaySafetyLevel: DisplaySafetyLevel;
  accentClassName: string;
  urgencyCopy: string | null;
};

export type HomeContext = {
  careDay: CareDay;
  generatedAt: string;
  primaryMessage: string;
  cards: HomeActionCard[];
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

function toHomeActionCard(card: CareActionCard, now: Date): HomeActionCard {
  const displaySafetyLevel = computeDisplaySafetyLevel(card, now);
  const recheckCopy = reminderFallbackCopy(computeReminderFallbackState(card, now));

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    scheduledAt: card.scheduled_at,
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

function getPrimaryMessage(careDay: CareDay) {
  if (careDay === 'onboarding') return '처음부터 많이 묻지 않고, 오늘 가장 부담이 적은 케어부터 같이 정리해요.';
  if (careDay === 'injection_day') return '오늘은 시간과 준비물이 흔들리지 않도록, 확인한 내용만 먼저 놓을게요.';
  if (careDay === 'clinic_day') return '방문 전에는 이동, 질문, 다음 안내를 한 번에 덜 급하게 확인해요.';
  if (careDay === 'waiting_day') return '오늘은 더 많이 확인하기보다, 필요한 일정만 조용히 붙잡아 둘게요.';
  return '오늘 해야 할 것과 쉬어도 되는 것을 나눠서 보여드릴게요.';
}
