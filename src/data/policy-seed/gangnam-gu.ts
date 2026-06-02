import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';

// 강남구 — 서울 기준에서 달라지는 항목만 오버라이드
// 출처: 강남구보건소 공지사항 (임의 값, 실 데이터로 교체 필요)
export const gangnamGu: PolicyStructuredSeed = {
  ...seoulBaseline,
  sigungu: '강남구',
  health_center_name: '강남구보건소',
  dept_name: '건강관리과 모자보건팀',
  contact_name: null,
  contact_email: null, // 실 이메일 확인 필요
  contact_phone: '02-3423-7000',

  drug_external_covered: true,
  non_covered_items: ['마취비', '검사비 일부', '원외처방 배란유도제'],

  online_apply_available: true,
  apply_url: 'https://www.e-health.go.kr',

  budget_exhausted: false,
  budget_notice: null,
  budget_checked_at: '2026-06-01T00:00:00+09:00',

  source_url: 'https://www.gangnam.go.kr/office/health/board/notice/list.do',
  last_verified_at: '2026-06-01T00:00:00+09:00',
  confidence: 0.7,
};
