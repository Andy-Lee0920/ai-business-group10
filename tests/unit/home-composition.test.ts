import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CareActionCard } from '../../src/types/care-cards.types';
import { computeHomeContext, type HomeContext } from '../../src/domain/home-composition';

const NOW = new Date('2026-05-10T09:00:00.000Z');
const BASE: CareActionCard = {
  id: 'card-routine',
  couple_id: 'couple-1',
  created_by: 'user-1',
  assignee_role: 'primary_user',
  card_type: 'medication',
  title: '프로게스테론 복용',
  description: null,
  source_text: '프로게스테론 복용',
  scheduled_at: '2026-05-10T12:00:00.000Z',
  care_date: null,
  status: 'confirmed',
  confirmation_required: false,
  user_marked_important: false,
  partner_visible: false,
  revision: 1,
};

function card(overrides: Partial<CareActionCard>): CareActionCard {
  return { ...BASE, ...overrides };
}

describe('home composition', () => {
  it('pins critical injection cards at the top with coral emphasis', () => {
    const context = computeHomeContext([
      BASE,
      card({ id: 'card-critical', card_type: 'injection', title: '고날에프 1회', scheduled_at: '2026-05-10T09:20:00.000Z' }),
    ], NOW);

    expect(context.cards[0]).toMatchObject({ id: 'card-critical', displaySafetyLevel: 'critical' });
    expect(context.cards[0]?.accentClassName).toContain('coral');
  });

  it('returns onboarding context with an empty card list before first capture', () => {
    const context = computeHomeContext([], NOW);
    expect(context.careDay).toBe('onboarding');
    expect(context.cards).toEqual([]);
    expect(context.primaryMessage).toContain('병원 메모');
  });

  it('does not mutate the card inputs while sorting', () => {
    const cards = [BASE, card({ id: 'card-2', card_type: 'injection', scheduled_at: NOW.toISOString() })];
    const original = cards.map((item) => ({ ...item }));
    computeHomeContext(cards, NOW);
    expect(cards).toEqual(original);
  });

  it('has a stable public return type', () => {
    expectTypeOf(computeHomeContext).returns.toMatchTypeOf<HomeContext>();
  });
});
