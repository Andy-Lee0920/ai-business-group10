import { describe, expect, it } from 'vitest';
import {
  evaluatePolicySupport,
  type PolicyStructuredPolicy,
  type PolicySupportUserContext,
} from '../../src/domain/policy-support';

const baseUser = {
  province: '서울특별시',
  district: '강남구',
  treatmentType: 'fresh_embryo',
  treatmentStartDate: '2026년 6월 10일',
  hasDiagnosisCertificate: true,
  hasDecisionNotice: false,
  supportAttemptCount: 'unknown',
  externalDrugCostExpected: 'unknown',
} as const satisfies PolicySupportUserContext;

const basePolicy = {
  province: '서울특별시',
  district: '강남구',
  healthCenter: '강남구보건소',
  department: '건강관리과 모자보건팀',
  phone: '02-3423-7104',
  email: 'familycare@gangnam.example.kr',
  supportedTreatmentTypes: ['fresh_embryo', 'frozen_embryo', 'iui'],
  requireDiagnosisCertificate: true,
  requireDecisionNoticeBeforeTreatment: true,
  budgetStatus: 'unknown',
  maxSupportAttempts: 'unknown',
  supportItems: [{ label: '예상 지원 항목', value: '신선배아 시술비 일부' }],
  sources: [
    {
      label: '강남구 난임부부 시술비 지원 안내',
      url: 'https://example.go.kr/ivf-support/gangnam',
      lastVerifiedAt: '2026년 6월 1일',
    },
  ],
} as const satisfies PolicyStructuredPolicy;

describe('policy support evaluator', () => {
  it('flags a missing decision notice as a pre-treatment action', () => {
    const result = evaluatePolicySupport(baseUser, basePolicy);

    expect(result.overallStatus).toBe('action_required');
    expect(result.statusLabel).toBe('시술 전 확인 필요');
    expect(result.conditionChecks).toContainEqual({
      item: '지원결정통지서',
      status: 'action_required',
      note: '시술 시작 전 지원결정통지서 발급 가능 여부를 확인해야 해요.',
    });
  });

  it('returns unknown when the regional policy data is missing', () => {
    const result = evaluatePolicySupport(baseUser, null);

    expect(result.overallStatus).toBe('unknown');
    expect(result.conditionChecks[0]).toMatchObject({
      item: '지역 정책',
      status: 'unknown',
    });
    expect(result.inquiryQuestions[0]).toContain('관할 보건소');
  });

  it('keeps generated copy away from final eligibility claims', () => {
    const result = evaluatePolicySupport(baseUser, basePolicy);
    const serialized = JSON.stringify(result);

    expect(serialized).toContain('지원 대상 여부를 확정하지 않아요');
    expect(serialized).not.toContain('100% 받을 수 있습니다');
    expect(serialized).not.toContain('지원 대상입니다');
    expect(serialized).not.toContain('무조건 신청 가능합니다');
  });
});
