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

  it('serializes exactly the five partner-action whitelist fields', () => {
    const [item] = serializePartnerViewCards([card()]);

    expect(Object.keys(item).sort()).toEqual([...PARTNER_VIEW_ITEM_FIELDS].sort());
    expect(item).toEqual({
      title: '고날에프 주사',
      scheduled_at: '2026-05-10T12:30:00.000Z',
      card_type: 'injection',
      description: '오늘 21시 고날에프 1회',
      display_state: 'current',
    });
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
    expectTypeOf(serializePartnerViewCards).parameter(0).toMatchTypeOf<readonly CareActionCard[]>();
    expectTypeOf(PARTNER_VIEW_ITEM_FIELDS).toEqualTypeOf<readonly ['title', 'scheduled_at', 'card_type', 'description', 'display_state']>();
  });
});
