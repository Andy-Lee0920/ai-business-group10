import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CARD_TYPES,
  type CardType,
  type CareActionCard,
  type CareDay,
  type DisplaySafetyLevel,
} from '../../src/types/care-cards.types';
import {
  computeCareDay,
  computeDisplaySafetyLevel,
  computeReminderFallbackState,
  inferCardType,
} from '../../src/domain/care-cards';

const NOW = new Date('2026-05-10T09:00:00.000Z');
const BASE_CARD: CareActionCard = {
  id: 'card-1',
  couple_id: 'couple-1',
  created_by: 'user-1',
  assignee_role: 'primary_user',
  card_type: 'general_action',
  title: '확인하기',
  description: null,
  source_text: '확인하기',
  scheduled_at: null,
  care_date: null,
  status: 'confirmed',
  confirmation_required: false,
  user_marked_important: false,
  partner_visible: false,
  revision: 1,
};

function card(overrides: Partial<CareActionCard>): CareActionCard {
  return { ...BASE_CARD, ...overrides };
}

describe('care action card domain', () => {
  it('classifies care day from capture history and confirmed cards', () => {
    expect(computeCareDay({ hasEverCaptured: false, cards: [], now: NOW })).toBe('onboarding');
    expect(computeCareDay({ hasEverCaptured: true, cards: [card({ card_type: 'injection', scheduled_at: NOW.toISOString() })], now: NOW })).toBe('injection_day');
    expect(computeCareDay({ hasEverCaptured: true, cards: [card({ card_type: 'clinic_visit', care_date: '2026-05-10' })], now: NOW })).toBe('clinic_day');
    expect(computeCareDay({ hasEverCaptured: true, cards: [card({ scheduled_at: '2026-05-11T09:00:00.000Z' })], now: NOW })).toBe('waiting_day');
    expect(computeCareDay({ hasEverCaptured: true, cards: [card({ card_type: 'medication', scheduled_at: NOW.toISOString() })], now: NOW })).toBe('routine_day');
  });

  it('infers card type deterministically from text and explicit correction', () => {
    expect(inferCardType('오늘 21시 고날에프 1회', 'my_action')).toBe('injection');
    expect(inferCardType('클리닉 방문 예약', 'my_action')).toBe('clinic_visit');
    expect(inferCardType('프로게스테론 복용', 'my_action')).toBe('medication');
    expect(inferCardType('물 한 잔 마시기', 'my_action')).toBe('general_action');
    expect(inferCardType('고날에프', 'my_action', 'record')).toBe('record');
  });

  it('computes display-only safety priority without mutating cards', () => {
    const injection = card({ card_type: 'injection', scheduled_at: '2026-05-10T09:25:00.000Z' });
    const original = { ...injection };
    expect(computeDisplaySafetyLevel(injection, NOW)).toBe('critical');
    expect(injection).toEqual(original);
    expect(computeDisplaySafetyLevel(card({ card_type: 'injection', scheduled_at: '2026-05-10T09:31:00.000Z' }), NOW)).toBe('time_sensitive');
    expect(computeDisplaySafetyLevel(card({ card_type: 'medication', scheduled_at: NOW.toISOString() }), NOW)).not.toBe('critical');
  });


  it('computes in-app recheck fallback only for missed important medication or injection cards', () => {
    expect(computeReminderFallbackState(card({
      card_type: 'injection',
      scheduled_at: '2026-05-10T08:40:00.000Z',
      user_marked_important: true,
    }), NOW)).toBe('needs_recheck');
    expect(computeReminderFallbackState(card({
      card_type: 'injection',
      scheduled_at: '2026-05-10T08:50:00.000Z',
      user_marked_important: true,
    }), NOW)).toBe('none');
    expect(computeReminderFallbackState(card({
      card_type: 'medication',
      scheduled_at: '2026-05-10T08:30:00.000Z',
      user_marked_important: false,
    }), NOW)).toBe('none');
    expect(computeReminderFallbackState(card({
      card_type: 'medication',
      scheduled_at: '2026-05-10T08:30:00.000Z',
      user_marked_important: true,
      status: 'completed',
    }), NOW)).toBe('none');
  });

  it('handles null, undefined, and empty text boundaries safely', () => {
    expect(inferCardType(null, 'my_action')).toBe('general_action');
    expect(inferCardType(undefined, 'my_action')).toBe('general_action');
    expect(inferCardType('', 'my_action')).toBe('general_action');
    expect(computeDisplaySafetyLevel(null, NOW)).toBe('normal');
    expect(computeDisplaySafetyLevel(undefined, NOW)).toBe('normal');
  });

  it('exposes precise public return types and exhaustive CardType literals', () => {
    expectTypeOf(inferCardType).returns.toEqualTypeOf<CardType>();
    expectTypeOf(computeCareDay).returns.toEqualTypeOf<CareDay>();
    expectTypeOf(computeDisplaySafetyLevel).returns.toEqualTypeOf<DisplaySafetyLevel>();
    expectTypeOf<typeof CARD_TYPES[number]>().toEqualTypeOf<CardType>();
    const exhaustive: Record<CardType, true> = {
      injection: true,
      medication: true,
      clinic_visit: true,
      clinic_confirmation: true,
      partner_support: true,
      record: true,
      general_action: true,
    };
    expect(Object.keys(exhaustive)).toHaveLength(CARD_TYPES.length);
  });
});
