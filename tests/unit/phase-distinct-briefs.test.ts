import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('phase-distinct planning briefs', () => {
  it('locks the #141 layout composition contract', () => {
    const doc = readFileSync('docs/02-design/phase-distinct-layout-composition.md', 'utf8');
    expect(doc).toContain('A care phase is not a theme');
    expect(doc).toContain('Component matrix');
    expect(doc).toContain('Time ring');
    expect(doc).toContain('Dynamic focus headline');
    expect(doc).toContain('Whitespace');
    expect(doc).toContain('RoutineDay');
    expect(doc).toContain('same top five component test ids must not appear in the same order');
  });

  it('locks the #140 clinic context-review surface contract', () => {
    const doc = readFileSync('docs/02-design/clinic-day-context-review.md', 'utf8');
    expect(doc).toContain('바뀐 약과 주사를 먼저 말해요');
    expect(doc).toContain('약/주사 확인');
    expect(doc).toContain('동행자');
    expect(doc).toContain('/home?care=clinic');
    expect(doc).toContain('No LLM medical judgment');
  });

  it('locks the #138 usefulness reset gate', () => {
    const doc = readFileSync('docs/02-design/ux-usefulness-reset.md', 'utf8');
    expect(doc).toContain('What care moment is happening today?');
    expect(doc).toContain('/partner/[token]');
    expect(doc).toContain('no defensive negative phrasing');
    expect(doc).toContain('Green condition:');
  });

  it('locks the #142 bespoke asset audit', () => {
    const doc = readFileSync('docs/02-design/fevio-bespoke-visual-asset-kit.md', 'utf8');
    expect(doc).toContain('Tier 1 — Lucide icon');
    expect(doc).toContain('Patient anchor');
    expect(doc).toContain('Clinic context document glyph');
    expect(doc).toContain('every circle must share one origin');
    expect(doc).toContain('reject if it becomes a decorative badge');
  });
});
