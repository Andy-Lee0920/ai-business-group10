import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('phase-distinct planning briefs', () => {
  it('locks the #141 layout composition contract', () => {
    const doc = readFileSync('docs/02-design/phase-distinct-layout-composition.md', 'utf8');
    expect(doc).toContain('A care phase is not a theme');
    expect(doc).toContain('Component matrix');
    expect(doc).toContain('Time ring');
    expect(doc).toContain('Briefing checklist');
    expect(doc).toContain('Whitespace');
    expect(doc).toContain('RoutineDay');
    expect(doc).toContain('same top five component test ids must not appear in the same order');
  });

  it('locks the #140 clinic briefing surface contract', () => {
    const doc = readFileSync('docs/02-design/clinic-day-doctor-trust-briefing.md', 'utf8');
    expect(doc).toContain('오늘 진료실에 가지고 갈 것들');
    expect(doc).toContain('지난 7일 케어 기록');
    expect(doc).toContain('동행자');
    expect(doc).toContain('/home?care=clinic');
    expect(doc).not.toContain('medical recommendation generation, doctor portal, EHR export, or treatment strategy inference.\n\n## Goal');
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
    expect(doc).toContain('Clinic briefing document glyph');
    expect(doc).toContain('every circle must share one origin');
    expect(doc).toContain('reject if it becomes a decorative badge');
  });
});
