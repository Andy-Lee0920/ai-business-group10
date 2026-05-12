export type TwoWeekWaitTone = 'settling' | 'steady' | 'nearing_beta';

export type TwoWeekWaitAnchorInput = {
  transferDate: string;
  betaDate: string;
  today: string;
};

export type TwoWeekWaitAnchor = {
  dayPostTransfer: number;
  daysUntilBeta: number;
  title: string;
  tone: TwoWeekWaitTone;
  explanation: string;
  judgementBoundary: string;
  primaryAction: string;
  checkInPrompts: readonly string[];
};

const DAY_MS = 86_400_000;
const FORBIDDEN_COPY_PATTERN = /임테기|착상 성공|실패|다음 cycle|증상 검색/u;

export function buildTwoWeekWaitAnchor(input: TwoWeekWaitAnchorInput): TwoWeekWaitAnchor {
  const dayPostTransfer = Math.max(0, diffDays(input.today, input.transferDate));
  const daysUntilBeta = Math.max(0, diffDays(input.betaDate, input.today));
  const copy = copyForDayPostTransfer(dayPostTransfer, daysUntilBeta);

  return {
    dayPostTransfer,
    daysUntilBeta,
    title: `이식 후 D+${dayPostTransfer} · 피검까지 ${daysUntilBeta}일`,
    tone: toneForDayPostTransfer(dayPostTransfer),
    explanation: copy.explanation,
    judgementBoundary: '오늘 판단하지 않아도 되는 날이에요. 증상은 기록만 하고 결론은 병원 확인까지 미뤄둘게요.',
    primaryAction: '오늘은 기록만 남기기',
    checkInPrompts: ['몸 상태 한 줄', '마음 상태 한 줄'],
  };
}

export function isForbiddenTwoWeekWaitCopy(copy: string): boolean {
  return FORBIDDEN_COPY_PATTERN.test(copy);
}

function copyForDayPostTransfer(dayPostTransfer: number, daysUntilBeta: number) {
  if (dayPostTransfer <= 3) {
    return {
      explanation: '초기 며칠은 몸을 설득하려 애쓰지 않아도 되는 시간이에요. 정해진 루틴을 유지하는 것이 전부예요.',
    };
  }
  if (dayPostTransfer <= 7) {
    return {
      explanation: '증상으로 결론을 내리지 않는 연습이 필요한 구간이에요. 기록은 남기고 해석은 보류해요.',
    };
  }
  return {
    explanation: `피검까지 ${daysUntilBeta}일 남았어요. 결과는 병원에서 확인하고, 오늘은 루틴과 휴식만 지켜요.`,
  };
}

function toneForDayPostTransfer(dayPostTransfer: number): TwoWeekWaitTone {
  if (dayPostTransfer <= 3) return 'settling';
  if (dayPostTransfer <= 7) return 'steady';
  return 'nearing_beta';
}

function diffDays(laterIsoDate: string, earlierIsoDate: string): number {
  const later = Date.parse(`${laterIsoDate}T00:00:00.000Z`);
  const earlier = Date.parse(`${earlierIsoDate}T00:00:00.000Z`);
  if (Number.isNaN(later) || Number.isNaN(earlier)) return 0;
  return Math.round((later - earlier) / DAY_MS);
}
