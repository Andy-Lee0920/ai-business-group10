import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const REQUIRED_AREAS = [
  'Shared Care State Foundation',
  'State-driven Generative UI Engine',
  'Role-aware Patient/Partner Translation',
  'Partner Assist Operator Model',
  'Patient-owned Sharing Scope',
  'InjectionLog Trust Ledger',
  'Role-based Onboarding',
  'Live Sync Proof',
  'Safety / Privacy Boundary',
] as const;

describe('Fevio Care OS architecture scorecard', () => {
  it('documents the current score, target score, and URL-based Green conditions', () => {
    const doc = readFileSync('docs/02-design/architecture-scorecard.md', 'utf8');

    expect(doc).toContain('Current baseline: 54 / 100');
    expect(doc).toContain('Next target: 80 / 100');
    expect(doc).toContain('URL Green condition');
    for (const area of REQUIRED_AREAS) expect(doc).toContain(area);
  });
});
