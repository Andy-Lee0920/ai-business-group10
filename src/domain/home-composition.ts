import { computeCareDay, computeDisplaySafetyLevel } from './care-cards';
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

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    scheduledAt: card.scheduled_at,
    displaySafetyLevel,
    accentClassName: displaySafetyLevel === 'critical' ? 'home-card--critical home-card--coral' : 'home-card--calm',
    urgencyCopy: displaySafetyLevel === 'critical' ? '시간 다 됐어요 · 지금 ±30분' : null,
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
  if (careDay === 'onboarding') return '병원 메모를 입력하면 오늘 카드가 만들어져요.';
  if (careDay === 'injection_day') return '오늘은 주사 시간이 먼저 보여요.';
  if (careDay === 'clinic_day') return '오늘 병원 방문 카드가 있어요.';
  if (careDay === 'waiting_day') return '대기 중인 다음 일정만 조용히 확인해요.';
  return '오늘 확인할 실행 카드를 정리했어요.';
}
