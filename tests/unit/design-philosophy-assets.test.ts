import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fevioTokens } from '../../src/design/tokens';

const PHILOSOPHY_DOC = 'docs/design/fevio-design-philosophy.md';
const ASSET_KIT_DOC = 'docs/design/fevio-asset-kit.md';

describe('Phase 0.5 design philosophy and asset kit (#123)', () => {
  const philosophy = readFileSync(PHILOSOPHY_DOC, 'utf8');
  const assetKit = readFileSync(ASSET_KIT_DOC, 'utf8');

  it('codifies the Deep Research integration pillars as product constraints', () => {
    for (const required of [
      'State-Based Care OS',
      'restrained warmth',
      'Partner screens translate patient state into supportive roles',
      'Action-first components',
      'Contextual translation components',
      'Quiet & empathy components',
      '과배란 유도',
      '최종 성숙',
      '난자 채취',
      '배아 배양',
      '이식 후 대기',
    ]) {
      expect(philosophy).toContain(required);
    }
  });

  it('locks at least ten do/don’t copy decision cards for restrained warmth', () => {
    const rows = philosophy
      .split('\n')
      .filter((line) => line.startsWith('|') && !line.includes('---') && !line.includes('Context | Do'));

    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(philosophy).toContain('우울함 80%');
    expect(philosophy).toContain('오늘은 조금 지쳐 보여요');
  });

  it('documents the reusable asset kit and exposes matching code tokens', () => {
    for (const required of [
      '--fevio-sky',
      '--fevio-shadow-soft',
      '--fevio-phone-frame-max',
      '--fevio-dynamic-island-top-offset',
      'Interview onboarding',
      'Dual-view demo',
    ]) {
      expect(assetKit).toContain(required);
    }

    expect(fevioTokens.color).toMatchObject({
      sky: '#F0F9FF',
      border: '#E5E7EB',
      secondaryText: '#6B7280',
      tertiaryText: '#9CA3AF',
    });
    expect(fevioTokens.device.iphone17ProMax).toMatchObject({
      width: '440px',
      height: '956px',
      safeTop: '59px',
      dynamicIslandTop: '11px',
      dynamicIslandWidth: '125.67px',
    });
    expect(fevioTokens.careOS.phases.trigger.partnerRole).toBe('타이머 감시자');
  });
});
