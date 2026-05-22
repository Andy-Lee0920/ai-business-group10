import type {
  AssignedTo,
  CardType,
  CareActionCard,
  CareContextInput,
  CareDay,
  DisplaySafetyLevel,
  ReminderFallbackState,
} from '../types/care-cards.types';

const CARD_TYPE_KEYWORDS: Record<CardType, readonly string[]> = {
  injection: [
    '주사',
    '주사약',
    '고날에프',
    'gonal',
    '퓨레곤',
    'puregon',
    '메노푸어',
    'menopur',
    '오비드렐',
    'ovidrel',
    '데카펩틸',
    'decapeptyl',
    '루프론',
    'lupron',
    '프롤루텍스',
    '오가루트란',
    '가니레버',
    '세트로타이드',
    '트리거',
    '난포터지는',
  ],
  medication: ['약', '복약', '복용', '먹는', '정', '캡슐', 'mg', '질정', '프로게스테론', '에스트로겐', '유트로게스탄', '프로기노바', '프레마린', '엽산', '크리논', '루티너스', '듀파스톤', '아스피린', '질좌제', '질정'],
  clinic_visit: ['병원', '방문', '내원', '진료', '초음파', '피검', '피검사', '검사', '예약', '재방문', '채혈', '클리닉', '난포', '채취', '이식', '배아이식', '배양', '동결', '해동'],
  clinic_confirmation: ['확인', '물어', '문의', '재문의', '여쭤', '다시 확인', '헷갈림', '모르겠'],
  partner_support: ['파트너', '같이', '함께', '도와', '준비', '확인해줘', '챙겨'],
  record: ['기록', '메모', '컨디션', '체온', '증상', '통증', '느낌', '감자배아', '눈사람배아', '포배기', '수정률', '배아등급'],
  general_action: [],
};

const INFERENCE_PRIORITY: readonly CardType[] = [
  'injection',
  'medication',
  'clinic_visit',
  'partner_support',
  'record',
  'clinic_confirmation',
];

export function inferCardType(
  text: string | null | undefined,
  assignedTo: AssignedTo,
  userSelectedCardType?: CardType | null,
  suggestedCardType?: CardType | null,
): CardType {
  if (userSelectedCardType) return userSelectedCardType;
  if (assignedTo === 'clinic_confirmation') return 'clinic_confirmation';

  const normalized = (text ?? '').trim().toLowerCase();
  if (!normalized) return suggestedCardType ?? 'general_action';

  for (const type of INFERENCE_PRIORITY) {
    const keywords = CARD_TYPE_KEYWORDS[type];
    if (keywords.some((keyword) => hasKeyword(normalized, keyword))) {
      return type;
    }
  }

  return suggestedCardType ?? 'general_action';
}

/**
 * @deprecated Use `computeCareDayV2` from `src/domain/treatment-timeline.ts` for
 * TreatmentTimeline work. See ADR 0008: docs/04-decisions/0008-treatment-timeline-milestone-first.md.
 * This SLC fallback intentionally remains card-based until the v2 vertical slice is wired.
 */
export function computeCareDay(input: CareContextInput): CareDay {
  if (!input.hasEverCaptured) return 'onboarding';
  if (input.manuallySelectedCareDay === 'waiting_day') return 'waiting_day';

  const confirmed = input.cards.filter((card) => card.status === 'confirmed');
  const todayCards = confirmed.filter((card) => isCardOnDay(card, input.now));

  if (todayCards.some((card) => card.card_type === 'injection')) return 'injection_day';
  if (todayCards.some((card) => card.card_type === 'clinic_visit')) return 'clinic_day';
  if (todayCards.length > 0) return 'routine_day';
  if (confirmed.some((card) => isCardAfterDay(card, input.now))) return 'waiting_day';

  return 'routine_day';
}

export function computeDisplaySafetyLevel(
  card: CareActionCard | null | undefined,
  now: Date,
): DisplaySafetyLevel {
  if (!card || card.status !== 'confirmed') return 'normal';
  if (card.user_marked_important) return 'critical';

  if (card.card_type === 'injection' && card.scheduled_at) {
    const scheduledAt = new Date(card.scheduled_at);
    const minutesUntil = diffMinutes(scheduledAt, now);
    if (minutesUntil <= 30 && minutesUntil >= -30) return 'critical';
    if (isSameUtcDate(scheduledAt, now)) return 'time_sensitive';
  }

  if (card.confirmation_required) return 'time_sensitive';
  return 'normal';
}

export function computeReminderFallbackState(
  card: CareActionCard | null | undefined,
  now: Date,
): ReminderFallbackState {
  if (!card || card.status !== 'confirmed') return 'none';
  if (!card.user_marked_important || !card.scheduled_at) return 'none';
  if (card.card_type !== 'injection' && card.card_type !== 'medication') return 'none';

  const minutesUntil = diffMinutes(new Date(card.scheduled_at), now);
  return minutesUntil < -15 ? 'needs_recheck' : 'none';
}

export function reminderFallbackCopy(state: ReminderFallbackState) {
  if (state === 'needs_recheck') return '아직 확인 안 됐어요 · 조용히 다시 확인해 주세요.';
  return null;
}

function hasKeyword(normalized: string, keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  if (lowerKeyword === '약') {
    return normalized === '약' || /(^|\s)약($|\s)/u.test(normalized);
  }

  return normalized.includes(lowerKeyword);
}

function diffMinutes(target: Date, base: Date) {
  return (target.getTime() - base.getTime()) / 60_000;
}

function isCardOnDay(card: CareActionCard, now: Date) {
  if (card.care_date) return card.care_date === toUtcDate(now);
  if (!card.scheduled_at) return false;
  return isSameUtcDate(new Date(card.scheduled_at), now);
}

function isCardAfterDay(card: CareActionCard, now: Date) {
  const cardDate = card.care_date ?? card.scheduled_at?.slice(0, 10);
  return Boolean(cardDate && cardDate > toUtcDate(now));
}

function isSameUtcDate(left: Date, right: Date) {
  return toUtcDate(left) === toUtcDate(right);
}

function toUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
