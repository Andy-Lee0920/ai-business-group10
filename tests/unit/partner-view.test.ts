import { describe, expect, expectTypeOf, it } from 'vitest';
import { type CareActionCard } from '../../src/types/care-cards.types';
import {
  PARTNER_VIEW_ITEM_FIELDS,
  hashPartnerShareToken,
  isPartnerLinkUsable,
  serializePartnerViewCards,
  type PartnerActionViewItem,
  type PartnerShareLinkRecord,
} from '../../src/services/partner-view';

const NOW = new Date('2026-05-10T12:00:00.000Z');
const FUTURE = '2026-05-11T12:00:00.000Z';
const PAST = '2026-05-09T12:00:00.000Z';

const BASE_CARD: CareActionCard = {
  id: 'card-1',
  couple_id: 'couple-1',
  created_by: 'user-1',
  assignee_role: 'partner',
  card_type: 'injection',
  title: '고날에프 주사',
  description: '오늘 21시 고날에프 1회',
  source_text: 'raw memo must stay private',
  scheduled_at: '2026-05-10T12:30:00.000Z',
  care_date: '2026-05-10',
  status: 'confirmed',
  confirmation_required: true,
  user_marked_important: false,
  partner_visible: true,
  revision: 1,
};

function card(overrides: Partial<CareActionCard> = {}): CareActionCard {
  return { ...BASE_CARD, ...overrides };
}

function link(overrides: Partial<PartnerShareLinkRecord> = {}): PartnerShareLinkRecord {
  return {
    token_hash: 'hash-only',
    expires_at: FUTURE,
    revoked_at: null,
    ...overrides,
  };
}

describe('partner view serialization contract', () => {
  it('never serializes raw source text from confirmed cards', () => {
    const [item] = serializePartnerViewCards([card()]);

    expect(JSON.stringify(item)).not.toContain('raw memo');
    expect(item).not.toHaveProperty('source_text');
  });

  it('never serializes visit input ids or source input ids', () => {
    const [item] = serializePartnerViewCards([card()]);

    expect(item).not.toHaveProperty('visit_inputs');
    expect(item).not.toHaveProperty('source_input_id');
  });

  it('excludes cards that are not partner visible', () => {
    expect(serializePartnerViewCards([card({ partner_visible: false })])).toEqual([]);
  });

  it('serializes the partner-action whitelist fields with role translation and sync markers', () => {
    const [item] = serializePartnerViewCards([card()]);

    expect(Object.keys(item).sort()).toEqual([...PARTNER_VIEW_ITEM_FIELDS].sort());
    expect(item).toEqual({
      safe_id: expect.any(String),
      title: '고날에프 주사',
      scheduled_at: '2026-05-10T12:30:00.000Z',
      card_type: 'injection',
      description: '오늘 21시 고날에프 1회',
      display_state: 'current',
      sync_revision: 1,
      partner_role: '확인자',
      partner_action: '주사 시간 30분 전 준비물과 조용한 공간을 함께 확인해 주세요.',
      avoid_prompt: '마지막 순간 질문하거나 재촉하지 않기',
      visibility: 'partner_safe',
    });
  });

  it('projects completed cards as completed without adding private fields', () => {
    const [item] = serializePartnerViewCards([card({ status: 'completed', revision: 3 })]);

    expect(item).toEqual({
      safe_id: expect.any(String),
      title: '고날에프 주사',
      scheduled_at: '2026-05-10T12:30:00.000Z',
      card_type: 'injection',
      description: '오늘 21시 고날에프 1회',
      display_state: 'completed',
      sync_revision: 3,
      partner_role: '확인자',
      partner_action: '완료된 항목이에요. 확인자 역할은 다음 확인까지 조용히 유지해 주세요.',
      avoid_prompt: '마지막 순간 질문하거나 재촉하지 않기',
      visibility: 'partner_safe',
    });
    expect(Object.keys(item).sort()).toEqual([...PARTNER_VIEW_ITEM_FIELDS].sort());
  });

  it('hashes partner tokens with SHA-256 without returning the raw token', () => {
    expect(hashPartnerShareToken('raw-token')).toBe('34d328009b123fbbb0dc93f18b3e6de1ecf7b1a5783c33dff7ffe1926f09e943');
    expect(hashPartnerShareToken('raw-token')).not.toContain('raw-token');
  });

  it('rejects expired and revoked partner links', () => {
    expect(isPartnerLinkUsable(link(), NOW)).toBe(true);
    expect(isPartnerLinkUsable(link({ expires_at: PAST }), NOW)).toBe(false);
    expect(isPartnerLinkUsable(link({ revoked_at: NOW.toISOString() }), NOW)).toBe(false);
  });

  it('has public type contracts for the serializer and whitelist', () => {
    expectTypeOf(serializePartnerViewCards).returns.toEqualTypeOf<PartnerActionViewItem[]>();
    expectTypeOf<readonly CareActionCard[]>().toMatchTypeOf<Parameters<typeof serializePartnerViewCards>[0]>();
    expectTypeOf(PARTNER_VIEW_ITEM_FIELDS).toEqualTypeOf<readonly ['safe_id', 'title', 'scheduled_at', 'card_type', 'description', 'display_state', 'sync_revision', 'partner_role', 'partner_action', 'avoid_prompt', 'visibility']>();
  });
});
