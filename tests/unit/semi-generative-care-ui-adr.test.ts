import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Semi-generative Care Surface ADR', () => {
  it('documents specificity-first rules, Zod config, intensity, partner signal, and v2 path', () => {
    const adr = readFileSync('docs/04-decisions/0009-semi-generative-care-ui.md', 'utf8');

    for (const required of [
      'TPO specificity-first slot selection + Zod-validated JSON config',
      'config/care-surface-rules.json',
      'CareSurfaceRuleSchema',
      '--fevio-surface-intensity',
      'PartnerSurfaceSignal',
      'overrideReason=trigger_shot',
      'cardCount=0',
      'emotionTrend',
      'userExplanation',
      'Database-stored rules in v1',
    ]) {
      expect(adr).toContain(required);
    }
  });
});
