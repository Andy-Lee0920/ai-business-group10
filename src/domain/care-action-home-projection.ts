import type { CareActionCard, CardType, CareCardStatus } from '../types/care-cards.types';
import type { ScheduleItem, ScheduleStatus, ScheduleType } from '../types/slc.types';

export type CareActionHomeRow = CareActionCard & {
  created_at?: string | null;
};

export type LegacyHomeScheduleItem = ScheduleItem;

const DOSE_DESCRIPTION_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*(IU|iu|mg|mcg|mL|ml|정|회|캡슐|알)\s*$/u;

const CARD_TYPE_TO_SCHEDULE_TYPE: Partial<Record<CardType, ScheduleType>> = {
  injection: 'injection',
  medication: 'medication',
  clinic_visit: 'clinic',
  clinic_confirmation: 'clinic',
};

export function projectCareActionCardsToLegacyTodayItems(cards: readonly CareActionHomeRow[]): LegacyHomeScheduleItem[] {
  return cards
    .map(projectCareActionCardToLegacyTodayItem)
    .filter((item): item is LegacyHomeScheduleItem => item != null)
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
}

export function projectCareActionCardsForHome(cards: readonly CareActionHomeRow[]): LegacyHomeScheduleItem[] {
  return projectCareActionCardsToLegacyTodayItems(cards);
}

export function filterLegacyTodayItemsForHomeWindow(
  items: readonly LegacyHomeScheduleItem[],
  windowStartIso: string,
  windowEndIso: string,
): LegacyHomeScheduleItem[] {
  const windowStart = new Date(windowStartIso).getTime();
  const windowEnd = new Date(windowEndIso).getTime();
  return items.filter((item) => {
    const scheduled = new Date(item.scheduled_at).getTime();
    return scheduled >= windowStart && scheduled <= windowEnd;
  });
}

function projectCareActionCardToLegacyTodayItem(card: CareActionHomeRow): LegacyHomeScheduleItem | null {
  const type = CARD_TYPE_TO_SCHEDULE_TYPE[card.card_type];
  if (!type) return null;

  const scheduledAt = card.scheduled_at ?? careDateToKstStartIso(card.care_date);
  if (!scheduledAt) return null;
  const dose = parseDoseDescription(card.description);

  return {
    id: card.id,
    patient_id: card.created_by,
    medication_id: null,
    type,
    title: card.title,
    dose: dose?.dose ?? null,
    unit: dose?.unit ?? null,
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

function parseDoseDescription(description: string | null): { dose: string; unit: string } | null {
  const match = description?.match(DOSE_DESCRIPTION_PATTERN);
  if (!match) return null;
  const [, dose, unit] = match;
  if (!dose || !unit) return null;
  return { dose, unit: unit === 'iu' ? 'IU' : unit };
}
