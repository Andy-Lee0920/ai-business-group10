import { describe, expect, it } from 'vitest';
import {
  evaluatePolicySupport,
  mapPolicySeedToStructuredPolicy,
  type PolicyStructuredPolicy,
  type PolicySupportUserContext,
} from '../../src/domain/policy-support';
import { gangnamGu, seoulBaseline } from '../../src/data/policy-seed';

const baseUser = {
  province: '서울특별시',
  district: '강남구',
  treatmentType: 'fresh_embryo',
  treatmentStartDate: '2026년 6월 10일',
  maritalStatus: 'married',
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
  targetMarried: true,
  targetDefacto: true,
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
  it('maps structured policy seed data into the evaluator contract', () => {
    const policy = mapPolicySeedToStructuredPolicy(gangnamGu, '강남구');

    expect(policy).toMatchObject({
      province: '서울특별시',
      district: '강남구',
      healthCenter: '강남구보건소',
      department: '건강관리과 모자보건팀',
      budgetStatus: 'available',
    });
    expect(policy.supportedTreatmentTypes).toEqual([
      'fresh_embryo',
      'frozen_embryo',
      'iui',
    ]);
    expect(policy.supportItems).toContainEqual({
      label: '신선배아 상한',
      value: '최대 1,100,000원',
    });
    expect(policy.sources[0]).toMatchObject({
      label: '강남구 난임부부 시술비 지원 안내',
      url: gangnamGu.source_url,
    });
  });

  it('keeps the requested district when a Seoul baseline fallback is used', () => {
    const policy = mapPolicySeedToStructuredPolicy(seoulBaseline, '송파구');

    expect(policy.district).toBe('송파구');
    expect(policy.healthCenter).toBe('송파구 보건소');
    expect(policy.sources[0]?.label).toBe('송파구 난임부부 시술비 지원 안내');
  });

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

  it('escalates a missing pre-treatment notice when treatment is near', () => {
    const result = evaluatePolicySupport(
      {
        ...baseUser,
        evaluationDate: '2026-06-08',
      },
      {
        ...basePolicy,
        applyBeforeTreatment: true,
      },
    );

    expect(result.conditionChecks).toContainEqual({
      item: '지원결정통지서',
      status: 'action_required',
      note: '시술 시작까지 2일 남아 있어 지원결정통지서 발급 가능 여부를 바로 확인해야 해요.',
      daysUntilTreatment: 2,
    });
  });

  it('marks pre-treatment notice risk when the treatment date already passed', () => {
    const result = evaluatePolicySupport(
      {
        ...baseUser,
        evaluationDate: '2026-06-11',
      },
      {
        ...basePolicy,
        applyBeforeTreatment: true,
      },
    );

    expect(result.overallStatus).toBe('uncertain');
    expect(result.conditionChecks).toContainEqual({
      item: '지원결정통지서',
      status: 'risk',
      note: '시술 시작 전 발급 조건이 있는데 입력된 시술 시작일이 이미 지났을 수 있어요.',
      daysUntilTreatment: -1,
    });
  });

  it('uses budget exhaustion notice and external drug coverage in checks', () => {
    const result = evaluatePolicySupport(
      {
        ...baseUser,
        hasDecisionNotice: true,
        externalDrugCostExpected: true,
      },
      {
        ...basePolicy,
        budgetStatus: 'exhausted',
        budgetNotice: '2026년 예산 소진 공지가 있어 접수 가능 여부 확인이 필요합니다.',
        externalDrugCovered: false,
        policyConfidence: 0.8,
      },
    );

    expect(result.conditionChecks).toContainEqual({
      item: '예산',
      status: 'risk',
      note: '2026년 예산 소진 공지가 있어 접수 가능 여부 확인이 필요합니다.',
    });
    expect(result.conditionChecks).toContainEqual({
      item: '원외약제비',
      status: 'risk',
      note: '현재 구조화 정책에서는 원외약제비 지원 제외 가능성이 표시되어 있어요.',
    });
  });

  it('flags low-confidence fallback policy data for public-health-center confirmation', () => {
    const result = evaluatePolicySupport(
      {
        ...baseUser,
        hasDecisionNotice: true,
      },
      {
        ...basePolicy,
        policyConfidence: 0.5,
      },
    );

    expect(result.conditionChecks).toContainEqual({
      item: '정책 데이터 신뢰도',
      status: 'needs_check',
      note: '현재 정책 데이터는 폴백 또는 낮은 신뢰도 자료라 관할 보건소 확인이 필요해요.',
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

  it('confirms married status when policy targets married couples', () => {
    const result = evaluatePolicySupport(
      { ...baseUser, maritalStatus: 'married', hasDecisionNotice: true },
      { ...basePolicy, targetMarried: true },
    );

    expect(result.conditionChecks).toContainEqual({
      item: '혼인 상태',
      status: 'confirmed',
      note: '법적 혼인으로 입력되어 있어요.',
    });
  });

  it('flags defacto status as needs_check when policy supports it', () => {
    const result = evaluatePolicySupport(
      { ...baseUser, maritalStatus: 'defacto', hasDecisionNotice: true },
      { ...basePolicy, targetDefacto: true },
    );

    expect(result.conditionChecks).toContainEqual({
      item: '혼인 상태',
      status: 'needs_check',
      note: '사실혼으로 입력되어 있어요. 지원 가능 여부와 제출 서류를 보건소에서 확인해야 해요.',
    });
  });

  it('flags defacto status as risk when policy does not support it', () => {
    const result = evaluatePolicySupport(
      { ...baseUser, maritalStatus: 'defacto', hasDecisionNotice: true },
      { ...basePolicy, targetDefacto: false },
    );

    expect(result.conditionChecks).toContainEqual({
      item: '혼인 상태',
      status: 'risk',
      note: '현재 정책에서 사실혼 대상 지원 여부를 확인하지 못했어요. 보건소 직접 확인이 필요합니다.',
    });
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
