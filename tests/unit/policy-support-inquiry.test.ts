import { describe, expect, it } from 'vitest';
import {
  generatePolicyInquiryDraft,
  generatePolicyInquiryQuestions,
} from '../../src/domain/policy-support-inquiry';
import type {
  PolicyConditionCheck,
  PolicyStructuredPolicy,
  PolicySupportUserContext,
} from '../../src/domain/policy-support';

const user = {
  province: '서울특별시',
  district: '강남구',
  treatmentType: 'fresh_embryo',
  treatmentStartDate: '2026년 6월 10일',
  maritalStatus: 'married',
  hasDiagnosisCertificate: true,
  hasDecisionNotice: false,
  supportAttemptCount: 'unknown',
  externalDrugCostExpected: true,
} as const satisfies PolicySupportUserContext;

const policy = {
  province: '서울특별시',
  district: '강남구',
  healthCenter: '강남구보건소',
  department: '건강관리과 모자보건팀',
  phone: '02-3423-7104',
  email: 'familycare@example.kr',
  targetMarried: true,
  targetDefacto: true,
  supportedTreatmentTypes: ['fresh_embryo', 'frozen_embryo', 'iui'],
  requireDiagnosisCertificate: true,
  requireDecisionNoticeBeforeTreatment: true,
  budgetStatus: 'unknown',
  maxSupportAttempts: 'unknown',
  supportItems: [],
  sources: [],
} as const satisfies PolicyStructuredPolicy;

const attentionChecks = [
  {
    item: '예산',
    status: 'needs_check',
    note: '예산 잔여 여부 확인 필요',
  },
  {
    item: '지원결정통지서',
    status: 'action_required',
    note: '시술 전 통지서 확인 필요',
  },
  {
    item: '원외약제비',
    status: 'risk',
    note: '원외약제비 지원 제외 가능성',
  },
  {
    item: '정책 데이터 신뢰도',
    status: 'needs_check',
    note: '낮은 신뢰도',
  },
] as const satisfies readonly PolicyConditionCheck[];

describe('policy support inquiry generator', () => {
  it('generates questions from attention checks only', () => {
    const questions = generatePolicyInquiryQuestions({
      user,
      policy,
      conditionChecks: attentionChecks,
    });

    expect(questions).toContain('현재 강남구 난임부부 시술비 지원 예산이 남아 있나요?');
    expect(questions).toContain(
      '2026년 6월 10일 시작 예정인 체외수정 신선배아 시술 전에 지원결정통지서 발급이 가능한가요?',
    );
    expect(questions).toContain('원외약제비가 발생하면 어떤 서류로 청구할 수 있나요?');
    expect(questions).toContain('가장 최신 공지와 담당 부서를 어디에서 확인하면 될까요?');
  });

  it('keeps sensitive details out of the deterministic inquiry draft', () => {
    const draft = generatePolicyInquiryDraft({
      user,
      policy,
      conditionChecks: attentionChecks,
    });
    const serialized = JSON.stringify(draft);

    expect(serialized).toContain('서울특별시 강남구');
    expect(serialized).not.toContain('주민등록번호');
    expect(serialized).not.toContain('병원명');
    expect(serialized).not.toContain('상세 진단명');
    expect(serialized).not.toContain('배우자 개인정보');
    expect(serialized).not.toContain('검사 수치');
    expect(serialized).not.toContain('증빙 이미지');
  });

  it('falls back to a public-health-center policy question when policy data is missing', () => {
    const questions = generatePolicyInquiryQuestions({
      user,
      policy: null,
      conditionChecks: [
        {
          item: '지역 정책',
          status: 'unknown',
          note: '정책 데이터 없음',
        },
      ],
    });

    expect(questions).toEqual([
      '관할 보건소에서 현재 신청 가능한 난임부부 시술비 지원 정책이 있나요?',
    ]);
  });
});
