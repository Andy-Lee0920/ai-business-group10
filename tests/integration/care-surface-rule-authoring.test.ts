import { describe, expect, it } from 'vitest';
import fixtures from '../../config/care-surface-rule-fixtures.json';
import { computeCareSurface } from '../../src/domain/care-surface-engine';
import { detectCareSurfaceRuleConflicts } from '../../src/domain/care-os-architecture';
import { CARE_SURFACE_RULES } from '../../src/domain/care-surface-engine';
import type { CareSurfaceComponent, CareSurfaceSlot, FevioSurfaceContext } from '../../src/types/care-surface.types';

describe('semi-generative rule authoring guardrails', () => {
  it('keeps bundled rule fixtures deterministic', () => {
    for (const fixture of fixtures) {
      const result = computeCareSurface(fixture.context as FevioSurfaceContext);
      const expected = fixture.expected as Partial<Record<CareSurfaceSlot, CareSurfaceComponent> & { intensity: number; appliedRules: string[] }>;

      if ('hero' in expected) expect(result.slots.hero).toBe(expected.hero);
      if ('primary_card' in expected) expect(result.slots.primary_card).toBe(expected.primary_card);
      expect(result.intensity).toBe(expected.intensity);
      for (const ruleId of expected.appliedRules ?? []) expect(result.appliedRules).toContain(ruleId);
    }
  });

  it('reports no slot/specificity/priority conflict in the bundled rules', () => {
    expect(detectCareSurfaceRuleConflicts(CARE_SURFACE_RULES)).toEqual([]);
  });
});
