import type { HomeActionCard } from '../../domain/home-composition';
import type { CardType } from '../../types/care-cards.types';

export type QuietChecklistItem = {
  id: string;
  title: string;
  description?: string | null;
  badge?: string;
  cardType?: CardType;
};

export function findPrimaryCareCard(cards: readonly HomeActionCard[], preferredTitleFragment?: string) {
  if (preferredTitleFragment) {
    const preferred = cards.find((card) => card.title.includes(preferredTitleFragment));
    if (preferred) return preferred;
  }
  return cards[0] ?? null;
}

export function toQuietChecklistItems(
  cards: readonly HomeActionCard[],
  options: {
    fallbackDescription: string;
    badge: string | ((card: HomeActionCard) => string);
    limit?: number;
  },
): QuietChecklistItem[] {
  const visibleCards = typeof options.limit === 'number' ? cards.slice(0, options.limit) : cards;
  return visibleCards.map((card) => ({
    id: card.id,
    title: card.title,
    description: card.description ?? card.urgencyCopy ?? options.fallbackDescription,
    badge: typeof options.badge === 'function' ? options.badge(card) : options.badge,
    cardType: card.cardType,
  }));
}

export function withChecklistBadge(items: readonly Omit<QuietChecklistItem, 'badge'>[], badge: string): QuietChecklistItem[] {
  return items.map((item) => ({ ...item, badge }));
}

export function countPartnerActionSignals(cards: readonly HomeActionCard[]) {
  return cards.filter((card) => Boolean(card.description)).length;
}

export function toMissionCardData(card: HomeActionCard): { title: string; time: string } {
  const titleTime = card.title.match(/\b\d{1,2}:\d{2}\b/u)?.[0];
  const time = titleTime
    ?? (card.scheduledAt
      ? new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(new Date(card.scheduledAt))
      : '시간 미정');
  const title = card.title.replace(/^\d{1,2}:\d{2}\s*/u, '').replace(/—.*$/u, '').trim() || card.title;
  return { title, time };
}
