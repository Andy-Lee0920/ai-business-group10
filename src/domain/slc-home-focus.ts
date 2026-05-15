import { slcAssets, type SLCAsset } from '../design/slc-assets';
import type { ScheduleItem, ScheduleStatus } from '../types/slc.types';

export type ScheduleBadgeTone = 'coral' | 'amber' | 'default' | 'completed';
export type HomeFocusKind = 'clinic_soon' | 'clinic_tomorrow' | 'medication_due' | 'medication_upcoming' | 'missed' | 'empty';

export interface SchedulePresentation {
  status: ScheduleStatus;
  badgeLabel: '지금' | '곧' | '다음' | '완료' | '늦음';
  badgeTone: ScheduleBadgeTone;
}

export interface HomeFocus {
  kind: HomeFocusKind;
  badgeLabel: '병원' | '내일' | '확인' | '지금' | '다음' | '비어 있음';
  heading:
    | '병원 시간이 가까워요'
    | '내일 병원이에요'
    | '놓친 일정이 있어요'
    | '지금 챙길 시간이에요'
    | '다음 투약이 있어요'
    | '일정이 없어요';
  description: string;
  primaryItem: ScheduleItem | null;
}

const FIFTEEN_MINUTES = 15;
const SIXTY_MINUTES = 60;
const MISSED_GRACE_MINUTES = -30;

export function getHomePendingItems(items: ScheduleItem[], now = new Date()): ScheduleItem[] {
  const pending = items
    .filter((item) => item.status !== 'completed')
    .slice()
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
  const focus = resolveHomeFocus(pending, now);
  if (!focus.primaryItem) return pending;
  return [
    focus.primaryItem,
    ...pending.filter((item) => item.id !== focus.primaryItem?.id),
  ];
}

export function resolveHomeFocus(items: ScheduleItem[], now = new Date()): HomeFocus {
  const pending = items
    .filter((item) => item.status !== 'completed')
    .slice()
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());

  const missed = pending.find((item) => isSameLocalDate(new Date(item.scheduled_at), now) && (item.status === 'missed' || statusFromDiff(minutesUntil(item.scheduled_at, now)) === 'missed'));
  if (missed) {
    return {
      kind: 'missed',
      badgeLabel: '확인',
      heading: '놓친 일정이 있어요',
      description: formatFocusTime(missed, '완료 여부만 확인해요.'),
      primaryItem: missed,
    };
  }

  const clinicSoon = pending.find((item) => {
    const diffMin = minutesUntil(item.scheduled_at, now);
    return item.type === 'clinic' && isSameLocalDate(new Date(item.scheduled_at), now) && diffMin >= 0 && diffMin <= SIXTY_MINUTES;
  });
  if (clinicSoon) {
    return {
      kind: 'clinic_soon',
      badgeLabel: '병원',
      heading: '병원 시간이 가까워요',
      description: formatFocusTime(clinicSoon, '방문 시간만 먼저 볼게요.'),
      primaryItem: clinicSoon,
    };
  }

  const clinicTomorrow = pending.find((item) => item.type === 'clinic' && isTomorrowLocalDate(new Date(item.scheduled_at), now));
  if (clinicTomorrow) {
    return {
      kind: 'clinic_tomorrow',
      badgeLabel: '내일',
      heading: '내일 병원이에요',
      description: formatFocusTime(clinicTomorrow, '방문 시간만 남겨둘게요.'),
      primaryItem: clinicTomorrow,
    };
  }

  const medicationDue = pending.find((item) => isMedication(item) && ['due', 'due_soon'].includes(statusFromDiff(minutesUntil(item.scheduled_at, now))));
  if (medicationDue) {
    return {
      kind: 'medication_due',
      badgeLabel: '지금',
      heading: '지금 챙길 시간이에요',
      description: formatFocusTime(medicationDue, '할 일만 먼저 보여드려요.'),
      primaryItem: medicationDue,
    };
  }

  const medicationUpcoming = pending.find(isMedication);
  if (medicationUpcoming) {
    return {
      kind: 'medication_upcoming',
      badgeLabel: '다음',
      heading: '다음 투약이 있어요',
      description: formatFocusTime(medicationUpcoming, '다음 시간만 확인해요.'),
      primaryItem: medicationUpcoming,
    };
  }

  return {
    kind: 'empty',
    badgeLabel: '비어 있음',
    heading: '일정이 없어요',
    description: '확정된 일정이 생기면 여기에서 보여드릴게요.',
    primaryItem: null,
  };
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

function isMedication(item: ScheduleItem) {
  return item.type === 'injection' || item.type === 'medication';
}

function isSameLocalDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isTomorrowLocalDate(value: Date, now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameLocalDate(value, tomorrow);
}

function formatFocusTime(item: ScheduleItem, suffix: string) {
  const time = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return `${time} · ${suffix}`;
}

export function resolveHomeVisualAsset(kind: HomeFocusKind): SLCAsset {
  switch (kind) {
    case 'clinic_soon':
      return slcAssets.home.clinicWide;
    case 'clinic_tomorrow':
      return slcAssets.home.clinic;
    case 'medication_due':
      return slcAssets.home.injection;
    case 'medication_upcoming':
      return slcAssets.home.injectionWide;
    case 'missed':
      return slcAssets.home.missedRecovery;
    case 'empty':
      return slcAssets.home.empty;
  }
}
