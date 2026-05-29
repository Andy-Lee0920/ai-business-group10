import { describe, expect, it } from 'vitest';
import {
  filterLegacyTodayItemsForHomeWindow,
  projectCareActionCardsForHome,
  projectCareActionCardsToLegacyTodayItems,
} from '../../src/domain/care-action-home-projection';
import type { CareActionCard } from '../../src/types/care-cards.types';

const BASE_CARD: CareActionCard & { created_at: string } = {
  id: 'card-1',
  couple_id: 'couple-1',
  created_by: 'patient-1',
  assignee_role: 'primary_user',
  card_type: 'injection',
  title: '오비드렐 주사',
  description: null,
  source_text: '오비드렐 주사',
  scheduled_at: '2026-05-19T12:00:00.000Z',
  care_date: '2026-05-19',
  status: 'confirmed',
  confirmation_required: false,
  user_marked_important: true,
  partner_visible: true,
  revision: 1,
  created_at: '2026-05-19T01:00:00.000Z',
};

function card(overrides: Partial<typeof BASE_CARD> = {}) {
  return { ...BASE_CARD, ...overrides };
}

describe('care_action_cards → TodayScreen projection', () => {
  it('maps canonical executable card types into the existing ScheduleItem contract', () => {
    const projected = projectCareActionCardsForHome([
      card({ id: 'inject', card_type: 'injection', title: '오비드렐 주사' }),
      card({ id: 'med', card_type: 'medication', title: '듀파스톤 복용' }),
      card({ id: 'visit', card_type: 'clinic_visit', title: '병원 방문' }),
      card({ id: 'confirm', card_type: 'clinic_confirmation', title: '병원 안내 확인' }),
    ]);

    expect(projected.map((item) => [item.id, item.type, item.source])).toEqual([
      ['inject', 'injection', 'capture'],
      ['med', 'medication', 'capture'],
      ['visit', 'clinic', 'capture'],
      ['confirm', 'clinic', 'capture'],
    ]);
    expect(projected[0]).toMatchObject({
      patient_id: 'patient-1',
      title: '오비드렐 주사',
      scheduled_at: '2026-05-19T12:00:00.000Z',
      status: 'upcoming',
      created_at: '2026-05-19T01:00:00.000Z',
    });
  });

  it('keeps unsupported/non-executable card types out of the legacy home schedule list', () => {
    const projected = projectCareActionCardsForHome([
      card({ id: 'partner', card_type: 'partner_support', title: '파트너에게 공유' }),
      card({ id: 'record', card_type: 'record', title: '기록' }),
      card({ id: 'general', card_type: 'general_action', title: '메모' }),
    ]);

    expect(projected).toEqual([]);
  });

  it('uses care_date as a deterministic fallback time only when scheduled_at is absent', () => {
    const [projected] = projectCareActionCardsForHome([
      card({ id: 'clinic-date-only', card_type: 'clinic_visit', scheduled_at: null, care_date: '2026-05-20' }),
    ]);

    expect(projected?.scheduled_at).toBe('2026-05-20T00:00:00.000+09:00');
  });

  it('preserves user-confirmed dose and unit from canonical card description for today execution rows', () => {
    const [projected] = projectCareActionCardsForHome([
      card({ id: 'med-dose', card_type: 'medication', title: '듀파스톤 복용', description: '10 mg' }),
    ]);

    expect(projected).toMatchObject({
      id: 'med-dose',
      type: 'medication',
      title: '듀파스톤 복용',
      dose: '10',
      unit: 'mg',
    });
  });

  it('names the TodayScreen legacy adapter and keeps the home window filter separate', () => {
    const projected = projectCareActionCardsToLegacyTodayItems([
      card({ id: 'today', scheduled_at: '2026-05-19T12:00:00.000Z' }),
      card({ id: 'outside', scheduled_at: '2026-05-23T12:00:00.000Z' }),
    ]);

    expect(filterLegacyTodayItemsForHomeWindow(
      projected,
      '2026-05-19T00:00:00.000Z',
      '2026-05-21T23:59:59.999Z',
    ).map((item) => item.id)).toEqual(['today']);
  });
});
