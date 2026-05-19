import type { CareActionCard, CardType, CareCardStatus } from '../types/care-cards.types';
import type { ScheduleItem, ScheduleStatus, ScheduleType } from '../types/slc.types';

export type CareActionHomeRow = CareActionCard & {
  created_at?: string | null;
};

const CARD_TYPE_TO_SCHEDULE_TYPE: Partial<Record<CardType, ScheduleType>> = {
  injection: 'injection',
  medication: 'medication',
  clinic_visit: 'clinic',
  clinic_confirmation: 'clinic',
};

export function projectCareActionCardsForHome(cards: readonly CareActionHomeRow[]): ScheduleItem[] {
  return cards
    .map(projectCareActionCardForHome)
    .filter((item): item is ScheduleItem => item != null)
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
}

function projectCareActionCardForHome(card: CareActionHomeRow): ScheduleItem | null {
  const type = CARD_TYPE_TO_SCHEDULE_TYPE[card.card_type];
  if (!type) return null;

  const scheduledAt = card.scheduled_at ?? careDateToKstStartIso(card.care_date);
  if (!scheduledAt) return null;

  return {
    id: card.id,
    patient_id: card.created_by,
    medication_id: null,
    type,
    title: card.title,
    dose: null,
    unit: null,
    scheduled_at: scheduledAt,
    status: mapCareCardStatus(card.status),
    source: 'capture',
    created_at: card.created_at ?? scheduledAt,
  };
}

function mapCareCardStatus(status: CareCardStatus): ScheduleStatus {
  if (status === 'completed') return 'completed';
  if (status === 'dismissed' || status === 'revoked' || status === 'superseded' || status === 'archived') return 'missed';
  return 'upcoming';
}

function careDateToKstStartIso(careDate: string | null): string | null {
  if (!careDate) return null;
  return `${careDate}T00:00:00.000+09:00`;
}
