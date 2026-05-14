import type { ScheduleItem, ScheduleStatus } from '../types/slc.types';

export type ScheduleBadgeTone = 'coral' | 'amber' | 'default' | 'completed';

export interface SchedulePresentation {
  status: ScheduleStatus;
  badgeLabel: '지금' | '곧' | '다음' | '완료' | '늦음';
  badgeTone: ScheduleBadgeTone;
}

const FIFTEEN_MINUTES = 15;
const SIXTY_MINUTES = 60;
const MISSED_GRACE_MINUTES = -30;

export function getHomePendingItems(items: ScheduleItem[], now = new Date()): ScheduleItem[] {
  return items
    .filter((item) => item.status !== 'completed')
    .slice()
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
}

export function getSchedulePresentation(item: ScheduleItem, now = new Date()): SchedulePresentation {
  if (item.status === 'completed') {
    return { status: 'completed', badgeLabel: '완료', badgeTone: 'completed' };
  }

  const diffMin = minutesUntil(item.scheduled_at, now);
  const status = statusFromDiff(diffMin);

  if (status === 'due_soon' || status === 'due') {
    return { status, badgeLabel: '지금', badgeTone: 'coral' };
  }
  if (status === 'upcoming' && diffMin <= SIXTY_MINUTES) {
    return { status, badgeLabel: '곧', badgeTone: 'amber' };
  }
  if (status === 'missed') {
    return { status, badgeLabel: '늦음', badgeTone: 'default' };
  }
  return { status, badgeLabel: '다음', badgeTone: 'default' };
}

function minutesUntil(scheduledAt: string, now: Date) {
  return (new Date(scheduledAt).getTime() - now.getTime()) / 60_000;
}

function statusFromDiff(diffMin: number): ScheduleStatus {
  if (diffMin > FIFTEEN_MINUTES) return 'upcoming';
  if (diffMin > 0) return 'due_soon';
  if (diffMin > MISSED_GRACE_MINUTES) return 'due';
  return 'missed';
}
