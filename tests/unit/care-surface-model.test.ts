import { describe, expect, it } from 'vitest';
import { countPartnerActionSignals, findPrimaryCareCard, toQuietChecklistItems, withChecklistBadge } from '../../src/features/adaptive-home/care-surface-model';
import type { HomeActionCard } from '../../src/domain/home-composition';

function card(overrides: Partial<HomeActionCard>): HomeActionCard {
  return {
    id: overrides.id ?? 'card-1',
    title: overrides.title ?? '21:00 고날에프 확인',
    description: overrides.description ?? null,
    scheduledAt: overrides.scheduledAt ?? null,
    displaySafetyLevel: overrides.displaySafetyLevel ?? 'normal',
    accentClassName: overrides.accentClassName ?? 'home-card--calm',
    urgencyCopy: overrides.urgencyCopy ?? null,
  };
}

describe('care surface model', () => {
  it('keeps the preferred card and checklist fallback rules behind one interface', () => {
    const cards = [
      card({ id: 'visit', title: '내일 병원 방문', description: null }),
      card({ id: 'shot', title: '21:00 고날에프 확인', description: '펜과 알코올솜 준비', displaySafetyLevel: 'critical' }),
    ];

    expect(findPrimaryCareCard(cards, '고날에프')?.id).toBe('shot');
    expect(toQuietChecklistItems(cards, {
      fallbackDescription: '확인한 내용만 보여요.',
      badge: (item) => (item.displaySafetyLevel === 'critical' ? '먼저 확인' : '다음 차례'),
      limit: 2,
    })).toEqual([
      { id: 'visit', title: '내일 병원 방문', description: '확인한 내용만 보여요.', badge: '다음 차례' },
      { id: 'shot', title: '21:00 고날에프 확인', description: '펜과 알코올솜 준비', badge: '먼저 확인' },
    ]);
  });

  it('separates partner action signal counting from rendering copy', () => {
    const cards = [card({ id: 'one', description: '공유할 도움 행동' }), card({ id: 'two', description: null })];

    expect(countPartnerActionSignals(cards)).toBe(1);
    expect(withChecklistBadge([{ id: 'visit', title: '방문 시간 확인', description: '10분 전 도착' }], '방문 준비')).toEqual([
      { id: 'visit', title: '방문 시간 확인', description: '10분 전 도착', badge: '방문 준비' },
    ]);
  });
});
