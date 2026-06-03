import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';

export const seongdongGu: PolicyStructuredSeed = {
  ...seoulBaseline,
  sigungu: '성동구',
  health_center_name: '성동구보건소',
  dept_name: '모자보건 담당 부서',
  contact_name: null,
  contact_email: null,
  contact_phone: null,

  source_url: 'https://www.sd.go.kr/health/sub.do?key=2315',
  last_verified_at: '2026-06-03T00:00:00+09:00',
  confidence: 0.65,
};
