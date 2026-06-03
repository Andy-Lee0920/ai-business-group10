import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';

export const dongdaemunGu: PolicyStructuredSeed = {
  ...seoulBaseline,
  sigungu: '동대문구',
  health_center_name: '동대문구보건소',
  dept_name: '모자보건 담당 부서',
  contact_name: null,
  contact_email: null,
  contact_phone: null,

  online_apply_available: true,
  apply_url: 'https://www.e-health.go.kr',

  source_url: 'https://www.ddm.go.kr/health/contents.do?key=1274',
  last_verified_at: '2026-06-03T00:00:00+09:00',
  confidence: 0.75,
};
