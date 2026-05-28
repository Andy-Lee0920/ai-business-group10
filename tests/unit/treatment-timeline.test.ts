import { describe, expect, it } from 'vitest';
import { computeCareDayV2 } from '../../src/domain/treatment-timeline';
import type { CareActionCard } from '../../src/types/care-cards.types';
import type { TreatmentMilestone } from '../../src/types/treatment-timeline.types';

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

function milestone(overrides: Partial<TreatmentMilestone>): TreatmentMilestone {
  return {
    id: 'milestone-1',
    cycle_id: 'cycle-1',
    couple_id: 'couple-1',
    milestone: 'embryo_transfer',
    confirmed_at: TODAY,
    notes: null,
    created_at: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeCareDayV2 milestone-first care surface', () => {
  it('falls back to card inference when no milestone exists', () => {
    const result = computeCareDayV2([], [card({ card_type: 'clinic_visit' })], TODAY);

    expect(result).toMatchObject({ phaseCareDay: 'clinic_day', surfaceCareDay: 'clinic_day', overrideReason: 'none' });
  });

  it('derives injection phase from stimulation start milestone', () => {
    const result = computeCareDayV2([milestone({ milestone: 'stimulation_start' })], [], TODAY);

    expect(result).toMatchObject({ phaseCareDay: 'injection_day', surfaceCareDay: 'injection_day' });
  });

  it('derives clinic phase from retrieval or transfer procedure milestones', () => {
    expect(computeCareDayV2([milestone({ milestone: 'egg_retrieval' })], [], TODAY).phaseCareDay).toBe('clinic_day');
    expect(computeCareDayV2([milestone({ milestone: 'embryo_transfer' })], [], TODAY).phaseCareDay).toBe('clinic_day');
  });

  it('keeps waiting phase after transfer even when a routine progesterone injection card exists', () => {
    const result = computeCareDayV2(
      [milestone({ milestone: 'embryo_transfer', confirmed_at: '2026-05-07' })],
      [card({ id: 'progesterone', card_type: 'injection', title: '프로게스테론 주사', scheduled_at: '2026-05-10T09:00:00.000Z' })],
      TODAY,
    );

    expect(result.phaseCareDay).toBe('waiting_day');
    expect(result.surfaceCareDay).toBe('waiting_day');
    expect(result.foregroundCards[0]?.id).toBe('progesterone');
    expect(result.overrideReason).toBe('none');
  });

  it('lets confirmed trigger shot card override a waiting milestone surface', () => {
    const result = computeCareDayV2(
      [milestone({ milestone: 'embryo_transfer', confirmed_at: '2026-05-07' })],
      [card({ id: 'trigger', card_type: 'injection', title: '오비드렐 트리거 주사', scheduled_at: '2026-05-10T21:00:00.000Z' })],
      TODAY,
    );

    expect(result).toMatchObject({ phaseCareDay: 'waiting_day', surfaceCareDay: 'injection_day', overrideReason: 'trigger_shot' });
  });

  it('includes procedure time-gate clinic override reason when phase and surface differ', () => {
    const result = computeCareDayV2(
      [milestone({ milestone: 'embryo_transfer', confirmed_at: '2026-05-07' })],
      [card({ id: 'opu', card_type: 'clinic_visit', title: '난자 채취 시간 확정', scheduled_at: '2026-05-10T08:30:00.000Z' })],
      TODAY,
    );

    expect(result).toMatchObject({ phaseCareDay: 'waiting_day', surfaceCareDay: 'clinic_day', overrideReason: 'procedure_time_gate' });
  });
});
