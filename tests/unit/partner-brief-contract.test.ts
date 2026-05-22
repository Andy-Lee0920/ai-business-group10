import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PartnerRoleSurface } from '../../app/partner/[token]/PartnerRoleSurface';
import type { PartnerActionViewItem } from '../../src/types/partner-view.types';

const item: PartnerActionViewItem = {
  safe_id: 'safe-1',
  title: '오비드렐 250',
  scheduled_at: '2026-05-19T12:00:00.000Z',
  card_type: 'injection',
  description: '오비드렐 상세 안내',
  display_state: 'current',
  sync_revision: 1,
  partner_role: '확인 역할',
  partner_action: '알람 시간과 준비 공간을 함께 확인해 주세요.',
  avoid_prompt: '재촉하지 않기',
  visibility: 'partner_safe',
};

describe('Partner Brief contract', () => {
  it('shows momentLine and helpAction without medication facts in the DOM', () => {
    const markup = renderToStaticMarkup(React.createElement(PartnerRoleSurface, {
      items: [item],
      signal: {
        urgencyTier: 'routine',
        intensity: 0.3,
        phase: 'injection',
        momentCopy: 'fallback signal',
        brief: { momentLine: '오늘 함께 확인할 일이 있어요.', helpAction: '준비 공간만 함께 확인해 주세요.' },
      },
    }));

    expect(markup).toContain('오늘 함께 확인할 일이 있어요.');
    expect(markup).toContain('준비 공간만 함께 확인해 주세요.');
    expect(markup).not.toContain('오비드렐');
    expect(markup).not.toContain('250');
  });

  it('keeps reflection telemetry schema body-free', () => {
    const migration = readFileSync('supabase/migrations/202605220001_brief_samples.sql', 'utf8');
    expect(migration).toContain('reflection_opened boolean');
    expect(migration).toContain('dwell_ms integer');
    expect(migration).not.toMatch(/reflection_.*body|body_.*reflection|body text|body jsonb/iu);
  });
});
