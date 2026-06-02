import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';

// 마포구 — 서울 기준에서 달라지는 항목만 오버라이드
// 출처: 마포구보건소 공지사항 (임의 값, 실 데이터로 교체 필요)
export const mapoGu: PolicyStructuredSeed = {
  ...seoulBaseline,
  sigungu: '마포구',
  health_center_name: '마포구보건소',
  dept_name: '건강증진과 모자보건팀',
  contact_name: null,
  contact_email: null, // 실 이메일 확인 필요
  contact_phone: '02-3153-9000',

  drug_external_covered: null, // 미확인 — 보건소 확인 필요

  online_apply_available: true,
  apply_url: 'https://www.e-health.go.kr',

  budget_exhausted: false,
  budget_notice: null,
  budget_checked_at: '2026-06-01T00:00:00+09:00',

  source_url: 'https://www.mapo.go.kr/site/health/board/notice/list.do',
  last_verified_at: '2026-06-01T00:00:00+09:00',
  confidence: 0.7,
};
