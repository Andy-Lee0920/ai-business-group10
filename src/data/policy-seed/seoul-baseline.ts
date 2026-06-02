import type { PolicyStructuredSeed } from '../../types/policy-support.types';

// 서울특별시 공통 기준 — 자치구별 데이터가 없을 때 폴백으로 사용
// 출처: 서울시 임신·출산 정보센터 / 정부24 (임의 값, 실 데이터로 교체 필요)
export const seoulBaseline: PolicyStructuredSeed = {
  sido: '서울특별시',
  sigungu: null,
  health_center_name: '관할 보건소',
  dept_name: '모자보건팀',
  contact_name: null,
  contact_email: null,
  contact_phone: null,

  target_married: true,
  target_defacto: true,
  target_income_criteria: '건강보험료 기준 중위소득 180% 이하 (일부 구 상이)',
  target_age_limit: { female_max: 45, male_max: null },

  ivf_fresh_limit: 1_100_000,
  ivf_frozen_limit: 700_000,
  iui_limit: 300_000,
  drug_external_covered: null, // 구별 상이 — 반드시 보건소 확인
  non_covered_items: ['마취비', '검사비 일부'],
  non_covered_excluded: ['배아동결비', '착상전유전검사', '선택진료비'],

  require_decision_notice: true,
  apply_before_treatment: true,
  online_apply_available: true,
  apply_url: 'https://www.e-health.go.kr',
  required_documents: [
    '난임진단서',
    '주민등록등본 (부부 동일 주소)',
    '건강보험료 납부확인서',
    '혼인관계증명서',
    '신분증 사본',
  ],

  budget_exhausted: false,
  budget_notice: null,
  budget_checked_at: '2026-06-01T00:00:00+09:00',

  valid_from: '2026-01-01',
  valid_until: '2026-12-31',
  source_url: 'https://www.gov.kr/portal/rcvfvrSvc/dtlEx/278000000069',
  last_verified_at: '2026-06-01T00:00:00+09:00',
  confidence: 0.7, // 임의 값 — 수동 검증 후 상향
};
