import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeMode, normalizeStage } from '../../app/demo/page';

describe('7-stage demo routing', () => {
  it('normalizes mode and stage query params', () => {
    expect(normalizeMode(undefined)).toBe('intro');
    expect(normalizeMode('stage')).toBe('stage');
    expect(normalizeMode('bad')).toBe('intro');
    expect(normalizeStage(undefined)).toBe('2');
    expect(normalizeStage('5')).toBe('5');
    expect(normalizeStage('99')).toBe('2');
  });

  it('wires page searchParams into DualPanelDemoClient initial props', () => {
    const source = readFileSync('app/demo/page.tsx', 'utf8');
    expect(source).toContain('searchParams');
    expect(source).toContain('initialMode');
    expect(source).toContain('initialStageIndex');
  });

  it('removes the old three SelectionChip controller and uses numbered stage pills', () => {
    const source = readFileSync('app/demo/dual-panel-demo-client.tsx', 'utf8');
    expect(source).not.toContain('SelectionChip');
    expect(source).not.toContain('useState<PresentationCareParam>');
    expect(source).toContain('stage-pill-${stage.index}');
    expect(source).toContain("/demo?mode=stage&stage=");
    expect(source).toContain('router.replace');
  });
});
