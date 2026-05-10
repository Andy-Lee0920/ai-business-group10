import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  getPresentationCards,
  getPresentationClinicMemo,
  getPresentationPartnerView,
} from '../../src/lib/presentation-demo-data';
import type { CareActionCard } from '../../src/types/care-cards.types';

const NOW = new Date('2026-05-11T20:00:00.000Z');

describe('presentation demo data', () => {
  it('returns at least five cards for a complete presentation scenario', () => {
    expect(getPresentationCards(NOW).length).toBeGreaterThanOrEqual(5);
  });

  it('includes critical cards for presentation impact', () => {
    const cards = getPresentationCards(NOW);
    expect(cards.filter((card) => card.displaySafetyLevel === 'critical')).toHaveLength(2);
  });

  it('is deterministic for the same now value', () => {
    const a = getPresentationCards(NOW);
    const b = getPresentationCards(NOW);
    expect(a).toEqual(b);
  });

  it('returns fresh arrays so mutation does not affect the next call', () => {
    const a = getPresentationCards(NOW);
    a.pop();
    const b = getPresentationCards(NOW);
    expect(b.length).toBeGreaterThanOrEqual(5);
  });

  it('contains a Korean IVF clinic memo suitable for capture prefill', () => {
    const memo = getPresentationClinicMemo();
    expect(memo).toContain('고날에프');
    expect(memo).toContain('프로게스테론');
    expect(memo.split('\n').length).toBeGreaterThanOrEqual(4);
  });

  it('sanitizes partner view without raw memo, raw token, or raw user fields', () => {
    const items = getPresentationPartnerView();
    expect(items.length).toBeGreaterThanOrEqual(3);

    for (const item of items) {
      expect(item).not.toHaveProperty('raw_text');
      expect(item).not.toHaveProperty('token');
      expect(item).not.toHaveProperty('user_id');
    }
    expect(JSON.stringify(items)).not.toContain('원문 메모');
  });

  it('has public return types compatible with existing care-card and partner contracts', () => {
    expectTypeOf(getPresentationCards).returns.toMatchTypeOf<CareActionCard[]>();
    expectTypeOf(getPresentationClinicMemo).returns.toBeString();
  });
});
