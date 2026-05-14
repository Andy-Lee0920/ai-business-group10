import type { ScheduleItem } from '../types/slc.types';

const FOLLOW_UP_DELAY_MS = 60 * 60_000;

export function getClinicFollowUpPrompt(items: ScheduleItem[], now = new Date()): ScheduleItem | null {
  return items
    .filter((item) => shouldShowClinicFollowUp(item, now))
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime())[0] ?? null;
}

function shouldShowClinicFollowUp(item: ScheduleItem, now: Date) {
  if (item.type !== 'clinic') return false;
  if (item.status === 'completed') return false;
  if (!isSameLocalDate(new Date(item.scheduled_at), now)) return false;
  return new Date(item.scheduled_at).getTime() + FOLLOW_UP_DELAY_MS < now.getTime();
}

function isSameLocalDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}
