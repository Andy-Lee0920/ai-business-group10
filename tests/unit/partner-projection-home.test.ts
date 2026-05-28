import { describe, expect, it } from 'vitest';
import { shouldShowPartnerInviteCard, shouldShowPartnerProjection } from '../../src/features/adaptive-home/partner-projection';
import type { HomeContext } from '../../src/domain/home-composition';

const baseContext: HomeContext = {
  careDay: 'injection_day',
  generatedAt: '2026-05-12T00:00:00.000Z',
  primaryMessage: '오늘 케어',
  cards: [],
};

describe('home partner projection presence', () => {
  it('hides invite preparation and shows connected projection once a partner membership exists', () => {
    const context: HomeContext = {
      ...baseContext,
      roleIntent: { role: 'primary_with_partner', firstFold: 'shared_cycle_invite', primaryCta: '파트너 연결 확인' },
      partnerConnected: true,
    };

    expect(shouldShowPartnerProjection(context)).toBe(true);
    expect(shouldShowPartnerInviteCard(context)).toBe(false);
  });
});
