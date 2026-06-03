import type { PolicyStructuredSeed } from '../../types/policy-support.types';
import { seoulBaseline } from './seoul-baseline';
import { gangnamGu } from './gangnam-gu';
import { mapoGu } from './mapo-gu';
import { dongdaemunGu } from './dongdaemun-gu';
import { geumcheonGu } from './geumcheon-gu';
import { jongnoGu } from './jongno-gu';
import { seongbukGu } from './seongbuk-gu';
import { seongdongGu } from './seongdong-gu';
import { songpaGu } from './songpa-gu';

const DISTRICT_SEEDS: PolicyStructuredSeed[] = [
  gangnamGu,
  geumcheonGu,
  dongdaemunGu,
  mapoGu,
  seongbukGu,
  seongdongGu,
  songpaGu,
  jongnoGu,
];

export function getPolicySeed(sido: string, sigungu: string): PolicyStructuredSeed {
  const district = DISTRICT_SEEDS.find(
    (s) => s.sido === sido && s.sigungu === sigungu
  );
  if (district) return district;

  // 자치구 데이터 없으면 시도 기준 폴백
  if (sido === '서울특별시') return seoulBaseline;

  return {
    ...seoulBaseline,
    sido,
    sigungu,
    health_center_name: `${sigungu} 보건소`,
    contact_phone: null,
    source_url: 'https://www.gov.kr/portal/rcvfvrSvc/dtlEx/278000000069',
    confidence: 0.5, // 폴백 데이터 — 신뢰도 낮음
  };
}

export {
  seoulBaseline,
  gangnamGu,
  geumcheonGu,
  dongdaemunGu,
  mapoGu,
  seongbukGu,
  seongdongGu,
  songpaGu,
  jongnoGu,
};
export type { PolicyStructuredSeed };
