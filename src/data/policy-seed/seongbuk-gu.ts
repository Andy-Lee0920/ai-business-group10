import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';

export const seongbukGu: PolicyStructuredSeed = {
  ...seoulBaseline,
  sigungu: '성북구',
  health_center_name: '성북구보건소',
  dept_name: '모자보건 담당 부서',
  contact_name: null,
  contact_email: null,
  contact_phone: null,

  online_apply_available: true,
  apply_url: 'https://www.e-health.go.kr',

  source_url: 'https://www.sb.go.kr/bogunso/contents.do?key=240',
  last_verified_at: '2026-06-03T00:00:00+09:00',
  confidence: 0.75,
};
