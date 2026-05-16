import { slcAssets, type SLCAsset } from '../design/slc-assets';
import type { ScheduleItem, ScheduleStatus } from '../types/slc.types';
import { formatKstTime, isSameKstDate, isTomorrowKstDate } from './kst-date';

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
    | '오늘 병원 가는 날'
    | '내일 준비되셨나요'
    | '확인이 필요한 주사가 있어요'
    | '오늘 밤, 주사'
    | '쉬어가는 날';
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

  const missed = pending.find((item) => isSameKstDate(item.scheduled_at, now) && (item.status === 'missed' || statusFromDiff(minutesUntil(item.scheduled_at, now)) === 'missed'));
  if (missed) {
    return {
      kind: 'missed',
      badgeLabel: '확인',
      heading: '확인이 필요한 주사가 있어요',
      description: formatFocusTime(missed, '예정된 주사 기록이 아직 완료되지 않았어요.'),
      primaryItem: missed,
    };
  }

  const clinicSoon = pending.find((item) => {
    const diffMin = minutesUntil(item.scheduled_at, now);
    return item.type === 'clinic' && isSameKstDate(item.scheduled_at, now) && diffMin >= 0 && diffMin <= SIXTY_MINUTES;
  });
  if (clinicSoon) {
    return {
      kind: 'clinic_soon',
      badgeLabel: '병원',
      heading: '오늘 병원 가는 날',
      description: formatFocusTime(clinicSoon, '방문 시간만 먼저 볼게요.'),
      primaryItem: clinicSoon,
    };
  }

  const medicationDue = pending.find((item) => isMedication(item) && ['due', 'due_soon'].includes(statusFromDiff(minutesUntil(item.scheduled_at, now))));
  if (medicationDue) {
    return {
      kind: 'medication_due',
      badgeLabel: '지금',
      heading: '오늘 밤, 주사',
      description: formatFocusTime(medicationDue, '할 일만 먼저 보여드려요.'),
      primaryItem: medicationDue,
    };
  }

  const medicationUpcoming = pending.find(isMedication);
  if (medicationUpcoming) {
    return {
      kind: 'medication_upcoming',
      badgeLabel: '다음',
      heading: '내일 준비되셨나요',
      description: formatFocusTime(medicationUpcoming, '다음 시간만 확인해요.'),
      primaryItem: medicationUpcoming,
    };
  }

  const clinicTomorrow = pending.find((item) => item.type === 'clinic' && isTomorrowKstDate(item.scheduled_at, now));
  if (clinicTomorrow) {
    return {
      kind: 'clinic_tomorrow',
      badgeLabel: '내일',
      heading: '내일 준비되셨나요',
      description: formatFocusTime(clinicTomorrow, '방문 시간만 남겨둘게요.'),
      primaryItem: clinicTomorrow,
    };
  }

  return {
    kind: 'empty',
    badgeLabel: '비어 있음',
    heading: '쉬어가는 날',
    description: '새 일정이 생기면 여기에서 바로 보여드릴게요.',
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

function formatFocusTime(item: ScheduleItem, suffix: string) {
  const time = formatKstTime(item.scheduled_at);
  return `${time} · ${suffix}`;
}

export function resolveHomeVisualAsset(kind: HomeFocusKind): SLCAsset {
  switch (kind) {
    case 'clinic_soon':
      return slcAssets.home.clinicWide;
    case 'clinic_tomorrow':
      return slcAssets.home.waiting;
    case 'medication_due':
      return slcAssets.home.injectionWide;
    case 'medication_upcoming':
      return slcAssets.home.injectionWide;
    case 'missed':
      return slcAssets.home.missedRecovery;
    case 'empty':
      return slcAssets.home.empty;
  }
}
