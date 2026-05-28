import { describe, expect, it } from 'vitest';
import rawRules from '../../config/care-surface-rules.json';
import { CareSurfaceRulesSchema, CareSurfaceRuleSchema } from '../../src/domain/care-surface-rule.schema';

describe('care surface rule config', () => {
  it('validates the bundled JSON rules with Zod', () => {
    const rules = CareSurfaceRulesSchema.parse(rawRules);

    expect(rules.map((rule) => rule.id)).toEqual(['trigger-shot-hero', 'no-cards-suppress-primary', 'waiting-day-quiet']);
  });

  it('rejects unknown operators, intensity overflow, and unregistered components', () => {
    const valid = CareSurfaceRulesSchema.parse(rawRules)[0]!;

    expect(() => CareSurfaceRuleSchema.parse({ ...valid, conditions: [{ field: 'careDay', op: 'contains', value: 'waiting_day' }] })).toThrow();
    expect(() => CareSurfaceRuleSchema.parse({ ...valid, intensity: 1.1 })).toThrow();
    expect(() => CareSurfaceRuleSchema.parse({ ...valid, component: 'FreeformGeneratedPanel' })).toThrow();
  });
});
