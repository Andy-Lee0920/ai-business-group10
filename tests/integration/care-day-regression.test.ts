import { describe, expect, it } from 'vitest';
import { computeCareDay } from '../../src/domain/care-cards';
import { computeCareDayV2 } from '../../src/domain/treatment-timeline';
import type { CareActionCard } from '../../src/types/care-cards.types';
import type { TreatmentMilestone } from '../../src/types/treatment-timeline.types';

const NOW = new Date('2026-05-10T09:00:00.000Z');
const TODAY = '2026-05-10';
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
  care_date: TODAY,
  status: 'confirmed',
  confirmation_required: false,
  user_marked_important: false,
  partner_visible: false,
  revision: 1,
};

function card(overrides: Partial<CareActionCard>): CareActionCard {
  return { ...BASE_CARD, ...overrides };
}

const fixtures: Array<{ name: string; cards: CareActionCard[] }> = [
  { name: 'today injection', cards: [card({ card_type: 'injection', scheduled_at: NOW.toISOString() })] },
  { name: 'today clinic', cards: [card({ card_type: 'clinic_visit', care_date: TODAY })] },
  { name: 'future card', cards: [card({ scheduled_at: '2026-05-11T09:00:00.000Z', care_date: '2026-05-11' })] },
  { name: 'today medication', cards: [card({ card_type: 'medication', scheduled_at: NOW.toISOString() })] },
  { name: 'empty confirmed history', cards: [] },
];

describe('care day v2 regression', () => {
  it.each(fixtures)('matches legacy fallback for old card-only data: $name', ({ cards }) => {
    const legacy = computeCareDay({ hasEverCaptured: true, cards, now: NOW });
    const v2 = computeCareDayV2([], cards.filter((item) => item.care_date === TODAY || item.scheduled_at?.slice(0, 10) === TODAY), TODAY);
    const expected = legacy === 'waiting_day' ? 'routine_day' : legacy;

    expect(v2.surfaceCareDay).toBe(expected);
  });

  it('requires trigger shot override reason when surface differs from milestone phase', () => {
    const milestones: TreatmentMilestone[] = [{
      id: 'transfer',
      cycle_id: 'cycle-1',
      couple_id: 'couple-1',
      milestone: 'embryo_transfer',
      confirmed_at: '2026-05-07',
      notes: null,
      created_at: '2026-05-07T00:00:00.000Z',
    }];
    const result = computeCareDayV2(milestones, [card({ card_type: 'injection', title: '오비드렐 트리거 주사', scheduled_at: NOW.toISOString() })], TODAY);

    expect(result.phaseCareDay).toBe('waiting_day');
    expect(result.surfaceCareDay).toBe('injection_day');
    expect(result.overrideReason).toBe('trigger_shot');
  });
});
