import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeMode, normalizeStage } from '../../app/demo/page';

describe('memo-to-care demo routing', () => {
  it('normalizes public funnel modes and keeps legacy stage URLs as generated debug context', () => {
    expect(normalizeMode(undefined)).toBe('intro');
    expect(normalizeMode('input')).toBe('input');
    expect(normalizeMode('stage', '5')).toBe('generated');
    expect(normalizeMode('stage')).toBe('intro');
    expect(normalizeMode('generated')).toBe('intro');
    expect(normalizeMode('parsing')).toBe('intro');
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

  it('uses the memo funnel as the primary route and keeps stage pills only inside presenter debug controls', () => {
    const source = readFileSync('app/demo/dual-panel-demo-client.tsx', 'utf8');
    expect(source).not.toContain('SelectionChip');
    expect(source).not.toContain('useState<PresentationCareParam>');
    expect(source).toContain('START_INPUT');
    expect(source).toContain('SUBMIT_MEMO');
    expect(source).toContain('DemoParsingScreen');
    expect(source).toContain('source-to-care-bridge');
    expect(source).toContain('발표자용 단계 전환');
    expect(source).toContain('stage-pill-${stage.index}');
    expect(source).toContain('/demo?mode=stage&stage=');
  });
});
