import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('TreatmentTimeline ADR contract', () => {
  it('documents milestone-first deprecation and override boundaries', () => {
    const adr = readFileSync('docs/04-decisions/0008-treatment-timeline-milestone-first.md', 'utf8');
    const careCards = readFileSync('src/domain/care-cards.ts', 'utf8');

    expect(adr).toContain('CareSurfaceContextV2');
    expect(adr).toContain('phaseCareDay');
    expect(adr).toContain('surfaceCareDay');
    expect(adr).toContain('trigger_shot');
    expect(adr).toContain('procedure_time_gate');
    expect(adr).toContain('/home?care=');
    expect(careCards).toContain('@deprecated');
    expect(careCards).toContain('0008-treatment-timeline-milestone-first.md');
  });
});
