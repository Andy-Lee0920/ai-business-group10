import type { HomeActionCard } from '../../domain/home-composition';
import type { QuickStat } from './care-surface-primitives';
import type { QuietChecklistItem } from './care-surface-model';

type ClinicFocusKind = 'schedule' | 'medication' | 'condition' | 'changes';

type ClinicFocusCopy = {
  eyebrow: string;
  title: string;
  context: string;
};

type ClinicModulePlan = {
  primaryLabel: string;
  secondaryLabel: string;
  primaryCta: string;
  primaryTime: string;
  secondaryTime: string;
  checklistLabel: string;
  partnerDescription: string;
  stats: (itemCount: number) => QuickStat[];
  priorityPattern?: RegExp;
};

export type ClinicFocusPackage = ClinicFocusCopy & ClinicModulePlan & {
  kind: ClinicFocusKind;
  items: QuietChecklistItem[];
};

const CLINIC_FOCUS_COPY: Record<ClinicFocusKind, ClinicFocusCopy> = {
  schedule: {
    eyebrow: '오늘 확인할 핵심',
    title: '다음 일정이 바뀌었는지 확인해요',
    context: '진료 전에 지난 안내와 오늘 확인할 내용을 먼저 떠올려요.',
  },
  medication: {
    eyebrow: '오늘 확인할 핵심',
    title: '바뀐 약과 주사를 먼저 말해요',
    context: '지난 방문 이후 맞은 주사와 바뀐 약을 먼저 확인해요.',
  },
  condition: {
    eyebrow: '오늘 확인할 핵심',
    title: '몸 상태 변화를 빠뜨리지 않아요',
    context: '기록해 둔 증상과 컨디션 변화를 차분히 확인해요.',
  },
  changes: {
    eyebrow: '오늘 확인할 핵심',
    title: '지난 방문 뒤 바뀐 것만 확인해요',
    context: '일상이 바빠 놓치기 쉬운 변화를 진료 전에 차분히 확인해요.',
  },
};

const CLINIC_MODULE_PLANS: Record<ClinicFocusKind, ClinicModulePlan> = {
  schedule: {
    primaryLabel: '다음 안내',
    secondaryLabel: '함께 기록',
    primaryCta: '다음 안내 확인하기',
    primaryTime: '진료 전 확인',
    secondaryTime: '진료 후 기록',
    checklistLabel: '오늘 일정 확인 항목',
    partnerDescription: '이동 시간과 진료 후 다음 일정 기록을 함께 붙잡는 역할로 보여요',
    priorityPattern: /방문|예약|일정|채취|이식|피검|검사|초음파|결과|다음/u,
    stats: (itemCount) => [
      { label: '방문', value: '09:00' },
      { label: '다음 안내', value: '확인' },
      { label: '지난 기록', value: `${Math.max(itemCount, 1)}개` },
      { label: '파트너', value: '동행' },
    ],
  },
  medication: {
    primaryLabel: '약·주사',
    secondaryLabel: '함께 기록',
    primaryCta: '약·주사 확인하기',
    primaryTime: '먼저 말할 것',
    secondaryTime: '진료 후 기록',
    checklistLabel: '약·주사 확인 항목',
    partnerDescription: '바뀐 약과 주사 시간을 진료 후 함께 기록하는 역할로 보여요',
    priorityPattern: /주사|약|복용|용량|고날|오비드렐|프로게스테론/u,
    stats: (itemCount) => [
      { label: '약·주사', value: '우선' },
      { label: '용량·시간', value: '확인' },
      { label: '지난 기록', value: `${Math.max(itemCount, 1)}개` },
      { label: '파트너', value: '기록' },
    ],
  },
  condition: {
    primaryLabel: '몸 상태',
    secondaryLabel: '함께 확인',
    primaryCta: '몸 상태 확인하기',
    primaryTime: '놓치지 않기',
    secondaryTime: '진료 후 기록',
    checklistLabel: '몸 상태 변화 항목',
    partnerDescription: '불편했던 순간과 진료 후 안내를 함께 놓치지 않는 역할로 보여요',
    priorityPattern: /통증|출혈|복부|증상|컨디션|피로|불편/u,
    stats: (itemCount) => [
      { label: '몸 상태', value: '우선' },
      { label: '기록', value: `${Math.max(itemCount, 1)}개` },
      { label: '변화', value: '확인' },
      { label: '파트너', value: '동행' },
    ],
  },
  changes: {
    primaryLabel: '변화 확인',
    secondaryLabel: '함께 확인',
    primaryCta: '바뀐 것 확인하기',
    primaryTime: '오늘 확인할 핵심',
    secondaryTime: '진료 후 기록',
    checklistLabel: '오늘 떠올릴 항목',
    partnerDescription: '이동 시간과 진료 후 지시사항 기록을 함께 붙잡는 역할로 보여요',
    stats: (itemCount) => [
      { label: '지난 기록', value: `${Math.max(itemCount, 1)}개` },
      { label: '약·주사', value: '복기' },
      { label: '다음 안내', value: '기록' },
      { label: '파트너', value: '동행' },
    ],
  },
};

const FOCUS_PATTERNS: Array<{ kind: ClinicFocusKind; pattern: RegExp }> = [
  { kind: 'schedule', pattern: /다음|방문|예약|일정|채취|이식|피검|검사|초음파|결과/u },
  { kind: 'medication', pattern: /주사|약|복용|용량|고날|오비드렐|프로게스테론/u },
  { kind: 'condition', pattern: /통증|출혈|복부|증상|컨디션|피로|불편/u },
];

export function deriveClinicFocus(cards: readonly HomeActionCard[], items: QuietChecklistItem[]): ClinicFocusPackage {
  const kind = selectClinicFocusKind(cards);
  const modulePlan = CLINIC_MODULE_PLANS[kind];
  const prioritizedItems = modulePlan.priorityPattern ? sortClinicItems(items, modulePlan.priorityPattern) : items;

  return {
    kind,
    ...CLINIC_FOCUS_COPY[kind],
    ...modulePlan,
    items: prioritizedItems,
  };
}

function selectClinicFocusKind(cards: readonly HomeActionCard[]): ClinicFocusKind {
  const haystack = cards.map((card) => `${card.title} ${card.description ?? ''}`).join(' ');
  return FOCUS_PATTERNS.find(({ pattern }) => pattern.test(haystack))?.kind ?? 'changes';
}

function sortClinicItems(items: QuietChecklistItem[], pattern: RegExp) {
  return [...items].sort((left, right) => scoreClinicItem(right, pattern) - scoreClinicItem(left, pattern));
}

function scoreClinicItem(item: QuietChecklistItem, pattern: RegExp) {
  return pattern.test(`${item.title} ${item.description ?? ''}`) ? 1 : 0;
}
