import { describe, expect, it } from 'vitest';
import { computeCareSurface, evalCareSurfaceCondition } from '../../src/domain/care-surface-engine';
import type { CareSurfaceRule, FevioSurfaceContext } from '../../src/types/care-surface.types';

const BASE_CONTEXT: FevioSurfaceContext = {
  careDay: 'injection_day',
  overrideReason: 'none',
  cardCount: 2,
  partnerStatus: 'connected',
};

const RULES: CareSurfaceRule[] = [
  {
    id: 'trigger-shot-hero',
    slot: 'hero',
    component: 'CareMomentRing',
    conditions: [{ field: 'overrideReason', op: 'eq', value: 'trigger_shot' }],
    priority: 1,
    intensity: 1,
    momentCopy: '지금 가장 중요한 순간이에요.',
  },
  {
    id: 'waiting-day-quiet',
    slot: 'hero',
    component: 'CompactHeroGreeting',
    conditions: [{ field: 'careDay', op: 'eq', value: 'waiting_day' }],
    priority: 10,
    intensity: 0.2,
  },
  {
    id: 'no-cards-suppress-primary',
    slot: 'primary_card',
    component: null,
    conditions: [{ field: 'cardCount', op: 'eq', value: 0 }],
    priority: 2,
    intensity: 0.15,
    momentCopy: '오늘은 확인할 케어가 없어요.',
  },
  {
    id: 'specific-waiting-trigger',
    slot: 'hero',
    component: 'CareMomentRing',
    conditions: [
      { field: 'careDay', op: 'eq', value: 'waiting_day' },
      { field: 'overrideReason', op: 'eq', value: 'trigger_shot' },
    ],
    priority: 99,
    intensity: 0.9,
  },
];

describe('computeCareSurface', () => {
  it('uses CareMomentRing for trigger shot hero and returns critical intensity', () => {
    const result = computeCareSurface({ ...BASE_CONTEXT, overrideReason: 'trigger_shot' }, RULES);

    expect(result.slots.hero).toBe('CareMomentRing');
    expect(result.intensity).toBe(1);
    expect(result.appliedRules).toContain('trigger-shot-hero');
  });

  it('suppresses primary_card when cardCount is zero', () => {
    const result = computeCareSurface({ ...BASE_CONTEXT, cardCount: 0 }, RULES);

    expect(result.slots.primary_card).toBeNull();
    expect(result.suppressedSlots).toContain('primary_card');
    expect(result.appliedRules).toContain('no-cards-suppress-primary');
  });

  it('uses quiet waiting hero with low intensity', () => {
    const result = computeCareSurface({ ...BASE_CONTEXT, careDay: 'waiting_day' }, RULES);

    expect(result.slots.hero).toBe('CompactHeroGreeting');
    expect(result.intensity).toBe(0.2);
  });

  it('selects a more specific rule before lower numeric priority', () => {
    const result = computeCareSurface({ ...BASE_CONTEXT, careDay: 'waiting_day', overrideReason: 'trigger_shot' }, RULES);

    expect(result.slots.hero).toBe('CareMomentRing');
    expect(result.appliedRules).toContain('specific-waiting-trigger');
    expect(result.appliedRules).not.toContain('trigger-shot-hero');
  });

  it('excludes rules whose conditions do not match and only traces candidates as selected when they win', () => {
    const result = computeCareSurface(BASE_CONTEXT, RULES);

    expect(result.appliedRules).toEqual([]);
    expect(result.trace.every((entry) => entry.selected === false)).toBe(true);
  });

  it('keeps default injection composition when no rule wins', () => {
    const result = computeCareSurface(BASE_CONTEXT, RULES);

    expect(result.slots.hero).toBe('CompactHeroGreeting');
    expect(result.slots.primary_card).toBe('MissionCardPair');
    expect(result.slots.checklist).toBe('QuietChecklist');
    expect(result.intensity).toBe(0.5);
  });
});

describe('evalCareSurfaceCondition', () => {
  const context: FevioSurfaceContext = {
    careDay: 'clinic_day',
    overrideReason: null as never,
    proximityDays: 2,
    cardCount: 3,
    partnerStatus: 'seen',
  };

  it('covers eq neq lt lte gt gte exists operators', () => {
    expect(evalCareSurfaceCondition(context, { field: 'careDay', op: 'eq', value: 'clinic_day' })).toBe(true);
    expect(evalCareSurfaceCondition(context, { field: 'careDay', op: 'neq', value: 'waiting_day' })).toBe(true);
    expect(evalCareSurfaceCondition(context, { field: 'proximityDays', op: 'lt', value: 3 })).toBe(true);
    expect(evalCareSurfaceCondition(context, { field: 'proximityDays', op: 'lte', value: 2 })).toBe(true);
    expect(evalCareSurfaceCondition(context, { field: 'cardCount', op: 'gt', value: 2 })).toBe(true);
    expect(evalCareSurfaceCondition(context, { field: 'cardCount', op: 'gte', value: 3 })).toBe(true);
    expect(evalCareSurfaceCondition(context, { field: 'partnerStatus', op: 'exists', value: true })).toBe(true);
  });

  it('treats undefined as not existing and matches null only through eq null', () => {
    expect(evalCareSurfaceCondition(context, { field: 'emotionTrend', op: 'exists', value: true })).toBe(false);
    expect(evalCareSurfaceCondition(context, { field: 'overrideReason', op: 'eq', value: null })).toBe(true);
  });
});
