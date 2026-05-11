import type { HomeActionCard } from '../../domain/home-composition';

export type QuietChecklistItem = {
  id: string;
  title: string;
  description?: string | null;
  badge?: string;
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
  }));
}

export function withChecklistBadge(items: readonly Omit<QuietChecklistItem, 'badge'>[], badge: string): QuietChecklistItem[] {
  return items.map((item) => ({ ...item, badge }));
}

export function countPartnerActionSignals(cards: readonly HomeActionCard[]) {
  return cards.filter((card) => Boolean(card.description)).length;
}
