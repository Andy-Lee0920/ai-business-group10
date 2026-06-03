import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';

export const geumcheonGu: PolicyStructuredSeed = {
  ...seoulBaseline,
  sigungu: '금천구',
  health_center_name: '금천구보건소',
  dept_name: '모자보건 담당 부서',
  contact_name: null,
  contact_email: null,
  contact_phone: null,

  source_url: 'https://geumcheon.go.kr/health/contents.do?key=3775',
  last_verified_at: '2026-06-03T00:00:00+09:00',
  confidence: 0.65,
};
