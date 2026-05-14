import type { ClinicUpdate, ScheduleItem } from '../types/slc.types';

const FOLLOW_UP_DELAY_MS = 60 * 60_000;

export function getClinicFollowUpPrompt(items: ScheduleItem[], now = new Date()): ScheduleItem | null {
  return resolveClinicFollowUpPrompt(items, [], now);
}

export function resolveClinicFollowUpPrompt(
  items: ScheduleItem[],
  clinicUpdates: ClinicUpdate[] = [],
  now = new Date(),
): ScheduleItem | null {
  return items
    .filter((item) => shouldShowClinicFollowUp(item, clinicUpdates, now))
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime())[0] ?? null;
}

function shouldShowClinicFollowUp(item: ScheduleItem, clinicUpdates: ClinicUpdate[], now: Date) {
  if (item.type !== 'clinic') return false;
  if (item.status === 'completed') return false;
  if (!isSameLocalDate(new Date(item.scheduled_at), now)) return false;
  if (hasRelevantClinicUpdate(item, clinicUpdates)) return false;
  return new Date(item.scheduled_at).getTime() + FOLLOW_UP_DELAY_MS <= now.getTime();
}

function hasRelevantClinicUpdate(item: ScheduleItem, clinicUpdates: ClinicUpdate[]) {
  const scheduledAt = new Date(item.scheduled_at).getTime();
  return clinicUpdates.some((update) => (
    update.patient_id === item.patient_id
    && new Date(update.created_at).getTime() >= scheduledAt
  ));
}

function isSameLocalDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}
