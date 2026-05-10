import { describe, expect, it } from 'vitest';
import { PARTNER_VIEW_ITEM_FIELDS, serializePartnerViewCards } from '../../src/services/partner-view';
import { type CareActionCard } from '../../src/types/care-cards.types';

const card: CareActionCard = {
  id: 'card-1',
  couple_id: 'couple-1',
  created_by: 'user-1',
  assignee_role: 'partner',
  card_type: 'injection',
  title: '고날에프 주사',
  description: '오늘 21시 고날에프 1회',
  source_text: '원문 메모: 원장님이 말한 민감한 raw memo',
  scheduled_at: '2026-05-10T21:00:00.000+09:00',
  care_date: '2026-05-10',
  status: 'confirmed',
  confirmation_required: true,
  user_marked_important: false,
  partner_visible: true,
  revision: 4,
};

describe('partner view payload integration contract', () => {
  it('keeps each item schema exactly equal to the partner whitelist', () => {
    const payload = { items: serializePartnerViewCards([card]) };

    expect(payload.items).toHaveLength(1);
    expect(Object.keys(payload.items[0]).sort()).toEqual([...PARTNER_VIEW_ITEM_FIELDS].sort());
    expect(JSON.stringify(payload)).not.toContain('원문 메모');
    expect(JSON.stringify(payload)).not.toContain('source_input_id');
  });
});
