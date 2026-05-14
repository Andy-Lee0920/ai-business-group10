import type { ScheduleItem, ScheduleStatus } from '../types/slc.types';

export type ScheduleBadgeTone = 'coral' | 'amber' | 'default' | 'completed';
export type HomeFocusKind = 'clinic_soon' | 'clinic_tomorrow' | 'medication_due' | 'medication_upcoming' | 'empty';

export interface SchedulePresentation {
  status: ScheduleStatus;
  badgeLabel: '지금' | '곧' | '다음' | '완료' | '늦음';
  badgeTone: ScheduleBadgeTone;
}

export interface HomeFocus {
  kind: HomeFocusKind;
  badgeLabel: '병원 일정' | '내일 병원' | '투약 예정' | '다음 투약' | '일정 없음';
  heading: '병원 일정이 다가오고 있어요' | '내일 병원 가는 날이에요' | '투약 예정이 있어요' | '다음 투약이 예정되어 있어요' | '등록된 일정이 없어요';
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

  const clinicSoon = pending.find((item) => {
    const diffMin = minutesUntil(item.scheduled_at, now);
    return item.type === 'clinic' && isSameLocalDate(new Date(item.scheduled_at), now) && diffMin >= 0 && diffMin <= SIXTY_MINUTES;
  });
  if (clinicSoon) {
    return {
      kind: 'clinic_soon',
      badgeLabel: '병원 일정',
      heading: '병원 일정이 다가오고 있어요',
      description: formatFocusTime(clinicSoon, '방문 시간이 먼저 보여요. 약명보다 병원 일정 맥락을 확인해요.'),
      primaryItem: clinicSoon,
    };
  }

  const clinicTomorrow = pending.find((item) => item.type === 'clinic' && isTomorrowLocalDate(new Date(item.scheduled_at), now));
  if (clinicTomorrow) {
    return {
      kind: 'clinic_tomorrow',
      badgeLabel: '내일 병원',
      heading: '내일 병원 가는 날이에요',
      description: formatFocusTime(clinicTomorrow, '내일 방문 시간을 먼저 확인해요.'),
      primaryItem: clinicTomorrow,
    };
  }

  const medicationDue = pending.find((item) => isMedication(item) && ['due', 'due_soon', 'missed'].includes(statusFromDiff(minutesUntil(item.scheduled_at, now))));
  if (medicationDue) {
    return {
      kind: 'medication_due',
      badgeLabel: '투약 예정',
      heading: '투약 예정이 있어요',
      description: formatFocusTime(medicationDue, '시간이 가까운 주사·복용을 먼저 확인해요.'),
      primaryItem: medicationDue,
    };
  }

  const medicationUpcoming = pending.find(isMedication);
  if (medicationUpcoming) {
    return {
      kind: 'medication_upcoming',
      badgeLabel: '다음 투약',
      heading: '다음 투약이 예정되어 있어요',
      description: formatFocusTime(medicationUpcoming, '다음 주사·복용 시간을 차분히 확인해요.'),
      primaryItem: medicationUpcoming,
    };
  }

  return {
    kind: 'empty',
    badgeLabel: '일정 없음',
    heading: '등록된 일정이 없어요',
    description: '확정된 병원 일정이나 투약 일정이 생기면 홈에서 먼저 보여드릴게요.',
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
