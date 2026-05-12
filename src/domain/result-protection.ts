import type { TimelineCareDay } from '../types/treatment-timeline.types';

export type ResultProtectionReviewVisibility = 'hidden_until_user_opens' | 'open_by_user_request';

export type ResultProtectionSurfaceInput = {
  betaRecordedAt: string;
  now: string;
  reviewOpenedAt?: string | null;
};

export type ResultProtectionSurface = {
  careDay: Extract<TimelineCareDay, 'result_protection_day'>;
  isAlwaysFree: true;
  heroCopy: string;
  primaryAction: string;
  quietNonMedicationNotifications: boolean;
  allowRoutineMedicationReminders: boolean;
  reviewVisibility: ResultProtectionReviewVisibility;
  reviewClosedLabel: string;
  partnerGuidance: string;
};

const FORBIDDEN_COPY_PATTERN = /다음 cycle|다음 주기 준비|실패 원인|바로 다시|내 몸이/u;

export function buildResultProtectionSurface(input: ResultProtectionSurfaceInput): ResultProtectionSurface {
  return {
    careDay: 'result_protection_day',
    isAlwaysFree: true,
    heroCopy: '오늘은 아무것도 결정하지 않아도 됩니다. 결과를 받아든 직후의 하루는 보호받아야 해요.',
    primaryAction: '오늘은 결정하지 않기',
    quietNonMedicationNotifications: true,
    allowRoutineMedicationReminders: true,
    reviewVisibility: input.reviewOpenedAt ? 'open_by_user_request' : 'hidden_until_user_opens',
    reviewClosedLabel: '준비되면 이번 주기 기록 열어보기',
    partnerGuidance: '먼저 위로하거나 해결책을 말하기보다, 곁에 있고 필요한 일상만 조용히 도와주세요.',
  };
}

export function isForbiddenResultProtectionCopy(copy: string): boolean {
  return FORBIDDEN_COPY_PATTERN.test(copy);
}
