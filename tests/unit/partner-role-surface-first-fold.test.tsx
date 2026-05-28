import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PartnerRoleSurface } from '../../app/partner/[token]/PartnerRoleSurface';
import type { PartnerActionViewItem } from '../../src/types/partner-view.types';

const item = (overrides: Partial<PartnerActionViewItem>): PartnerActionViewItem => ({
  safe_id: 'safe-1',
  title: '듀파스톤 복용',
  scheduled_at: '2026-05-19T12:00:00.000Z',
  card_type: 'medication',
  description: '원문은 숨기고 파트너에게 필요한 말만 보여요.',
  display_state: 'current',
  sync_revision: 1,
  partner_role: '약 복용을 조용히 챙겨주세요',
  partner_action: '물과 알람을 같이 확인해 주세요.',
  avoid_prompt: '재촉하지 않기',
  visibility: 'partner_safe',
  ...overrides,
});

describe('PartnerRoleSurface first fold', () => {
  it('leads with one actionable “오늘 도와줄 일” card and allows non-injection assist CTA', () => {
    const onAssist = vi.fn();
    const markup = renderToStaticMarkup(
      <PartnerRoleSurface
        items={[
          item({ safe_id: 'completed-injection', title: '완료된 주사', card_type: 'injection', display_state: 'completed', partner_action: '이미 도왔어요.' }),
          item({ safe_id: 'medication-help', title: '듀파스톤 복용', card_type: 'medication', partner_action: '물과 알람을 같이 확인해 주세요.' }),
        ]}
        onAssist={onAssist}
      />,
    );

    expect(markup).toContain('오늘 도와줄 일');
    expect(markup).toContain('복약 일정');
    expect(markup).not.toContain('듀파스톤 복용');
    expect(markup).not.toContain('완료된 주사');
    expect(markup).toContain('물과 알람을 같이 확인해 주세요.');
    expect(markup).toContain('도움 완료');
    expect(markup).not.toContain('raw clinic memo');
  });
});
