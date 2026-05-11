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
    expect(JSON.stringify(payload)).not.toContain('token_hash');
    expect(JSON.stringify(payload)).not.toContain('created_by');
    expect(JSON.stringify(payload)).not.toContain('user-1');
    expect(payload.items[0]).toMatchObject({
      display_state: 'current',
      sync_revision: 4,
      partner_role: '확인자',
      partner_action: expect.stringContaining('주사 시간 30분 전'),
      avoid_prompt: expect.stringContaining('재촉하지 않기'),
      visibility: 'partner_safe',
    });
  });

  it('keeps private emotion records out of the partner payload unless explicitly shared', () => {
    const privateEmotion: CareActionCard = {
      ...card,
      id: 'emotion-private',
      card_type: 'record',
      title: '감정 기록 · 불안해요',
      description: '나를 위한 비공개 감정 기록이에요. 공유하지 않아도 충분해요.',
      source_text: '감정 기록 · 불안해요 · 강도 5/5 · 실패할까봐 너무 무서워',
      partner_visible: false,
    };
    const sharedEmotion: CareActionCard = {
      ...privateEmotion,
      id: 'emotion-shared',
      title: '공유된 감정 신호',
      description: '오늘은 마음이 많이 긴장된 날이에요. 해결책보다 조용한 도움을 먼저 건네 주세요.',
      partner_visible: true,
    };

    const payload = { items: serializePartnerViewCards([privateEmotion, sharedEmotion]) };

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      title: '공유된 감정 신호',
      card_type: 'record',
      description: '오늘은 마음이 많이 긴장된 날이에요. 해결책보다 조용한 도움을 먼저 건네 주세요.',
      partner_role: '기록 동반자',
      visibility: 'private_summary',
    });
    expect(JSON.stringify(payload)).not.toContain('실패할까봐');
    expect(JSON.stringify(payload)).not.toContain('강도 5/5');
    expect(JSON.stringify(payload)).not.toContain('emotion-private');
  });

});
