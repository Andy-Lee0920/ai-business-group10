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

export const CARE_ACTION_SCHEDULE_SELECT = 'id,couple_id,created_by,assignee_role,card_type,title,description,source_text,scheduled_at,care_date,status,confirmation_required,user_marked_important,partner_visible,revision,created_at';

export type CareActionScheduleRow = CareActionHomeRow;

export function projectCareActionCardsForSchedule(cards: readonly CareActionScheduleRow[]): ScheduleItem[] {
  return cards
    .map(projectCareActionCardForSchedule)
    .filter((item): item is ScheduleItem => item != null)
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
}

export function projectCareActionCardsForHome(cards: readonly CareActionHomeRow[]): ScheduleItem[] {
  return projectCareActionCardsForSchedule(cards);
}

export function mergeCanonicalScheduleItemsWithLegacyFallback(
  canonicalItems: readonly ScheduleItem[],
  legacyItems: readonly ScheduleItem[],
): ScheduleItem[] {
  const canonicalFingerprints = new Set(canonicalItems.map(scheduleEquivalenceFingerprint));
  return [...canonicalItems, ...legacyItems.filter((item) => !canonicalFingerprints.has(scheduleEquivalenceFingerprint(item)))]
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
}

function scheduleEquivalenceFingerprint(item: ScheduleItem): string {
  return [
    item.patient_id,
    item.type,
    normalizeScheduleTitle(item.title),
    new Date(item.scheduled_at).getTime(),
  ].join('|');
}

function normalizeScheduleTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR');
}

export function projectCareActionCardForSchedule(card: CareActionScheduleRow): ScheduleItem | null {
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

export function scheduleTypeToCareCardType(type: ScheduleType): Extract<CardType, 'injection' | 'medication' | 'clinic_visit'> {
  if (type === 'clinic') return 'clinic_visit';
  return type;
}

export function careDateFromScheduledAt(iso: string): string {
  return iso.slice(0, 10);
}

function careDateToKstStartIso(careDate: string | null): string | null {
  if (!careDate) return null;
  return `${careDate}T00:00:00.000+09:00`;
}
