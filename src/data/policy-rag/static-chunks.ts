export type PolicyRagTopic =
  | '지원대상'
  | '지원금액'
  | '신청방법'
  | '지원결정통지서'
  | '서류'
  | '원외약제비'
  | '예산'
  | '연락처'
  | '정책신뢰도';

export type PolicyRagChunk = {
  id: string;
  sido: string;
  sigungu: string | null;
  topic: PolicyRagTopic;
  text: string;
  sourceLabel: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  confidence: number;
};

export const STATIC_POLICY_RAG_CHUNKS = [
  {
    id: 'seoul-baseline-decision-notice',
    sido: '서울특별시',
    sigungu: null,
    topic: '지원결정통지서',
    text: '서울 난임부부 시술비 지원은 보건소 승인과 지원결정통지서 발급 흐름을 전제로 한다. 시술 시작 전 신청 여부와 통지서 유효기간은 관할 보건소 확인이 필요하다.',
    sourceLabel: '서울시 임신·출산 정보센터',
    sourceUrl: 'https://seoul-agi.seoul.go.kr/ifc-csp',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.78,
  },
  {
    id: 'seoul-baseline-amounts',
    sido: '서울특별시',
    sigungu: null,
    topic: '지원금액',
    text: '서울시 기준 seed는 신선배아, 동결배아, 인공수정 항목별 상한액을 구조화해 비교한다. 실제 적용 금액은 시술 유형, 회차, 보건소 결정에 따라 확인해야 한다.',
    sourceLabel: '서울시 임신·출산 정보센터',
    sourceUrl: 'https://seoul-agi.seoul.go.kr/ifc-csp',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.72,
  },
  {
    id: 'ehealth-online-apply',
    sido: '서울특별시',
    sigungu: null,
    topic: '신청방법',
    text: '온라인 신청은 e보건소 의료비 지원 경로에서 확인하도록 안내한다. 온라인 가능 여부와 배우자·가구원 입력 절차는 신청 시점에 다시 확인해야 한다.',
    sourceLabel: 'e보건소',
    sourceUrl: 'https://www.e-health.go.kr',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.7,
  },
  {
    id: 'dongdaemun-decision-notice',
    sido: '서울특별시',
    sigungu: '동대문구',
    topic: '지원결정통지서',
    text: '동대문구 안내는 온라인 신청 후 통지서 발급 소요와 시술 전 통지서 확인 필요성을 강조한다. 통지서 없이 이미 시작된 시술의 소급 가능성은 보건소 확인이 필요하다.',
    sourceLabel: '동대문구보건소',
    sourceUrl: 'https://www.ddm.go.kr/health/contents.do?key=1274',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.78,
  },
  {
    id: 'songpa-support-history',
    sido: '서울특별시',
    sigungu: '송파구',
    topic: '지원대상',
    text: '송파구 안내는 관내 난임부부와 기존 지원 이력 확인의 중요성을 함께 다룬다. 과거 타 지역 지원 이력은 총 지원 가능성 판단에 영향을 줄 수 있어 확인 질문에 포함한다.',
    sourceLabel: '송파구보건소',
    sourceUrl: 'https://www.songpa.go.kr/ehealth/contents.do?key=4588',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.75,
  },
  {
    id: 'seongbuk-application-flow',
    sido: '서울특별시',
    sigungu: '성북구',
    topic: '신청방법',
    text: '성북구 안내는 정부24 또는 e보건소를 통한 신청과 보건소 승인 후 통지서 확인 흐름을 안내한다. 실제 출력 가능 시점은 관할 보건소 확인이 필요하다.',
    sourceLabel: '성북구보건소',
    sourceUrl: 'https://www.sb.go.kr/bogunso/contents.do?key=240',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.75,
  },
  {
    id: 'geumcheon-retroactive-risk',
    sido: '서울특별시',
    sigungu: '금천구',
    topic: '지원결정통지서',
    text: '금천구 안내는 지원결정통지서 발급 전 또는 시술 종료 후 소급지원이 어려울 수 있음을 강조한다. 시술 시작 전 신청 가능 여부를 우선 확인해야 한다.',
    sourceLabel: '금천구보건소',
    sourceUrl: 'https://geumcheon.go.kr/health/contents.do?key=3775',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.68,
  },
  {
    id: 'seongdong-before-treatment',
    sido: '서울특별시',
    sigungu: '성동구',
    topic: '지원결정통지서',
    text: '성동구 안내는 난임시술 시작 전 신청과 소급 적용 제한을 확인하도록 안내한다. 통지서 발급 소요를 고려해 미리 확인하는 흐름이 필요하다.',
    sourceLabel: '성동구보건소',
    sourceUrl: 'https://www.sd.go.kr/health/sub.do?key=2315',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.68,
  },
  {
    id: 'jongno-ehealth-contact',
    sido: '서울특별시',
    sigungu: '종로구',
    topic: '신청방법',
    text: '종로구 안내는 e보건소 의료비 지원 경로와 보건소 확인 흐름을 함께 안내한다. 신청 전 최신 담당 부서와 제출 경로를 확인한다.',
    sourceLabel: '종로구보건소',
    sourceUrl: 'https://www.jongno.go.kr/Health.do?menuId=401277&menuNo=401277',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.7,
  },
  {
    id: 'external-drug-documents',
    sido: '서울특별시',
    sigungu: null,
    topic: '원외약제비',
    text: '원외약제비는 처방전, 약제비 증빙 서류, 제출 기한 등 사후 청구 서류 확인이 필요하다. 자치구별 지원 가능 여부가 다를 수 있어 보건소 확인 질문으로 남긴다.',
    sourceLabel: '서울시/자치구 보건소 안내 종합',
    sourceUrl: 'https://seoul-agi.seoul.go.kr/ifc-csp',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.68,
  },
  {
    id: 'budget-confirmation',
    sido: '서울특별시',
    sigungu: null,
    topic: '예산',
    text: '예산 잔여 여부와 접수 마감 공지는 시점별로 달라질 수 있다. 정책 평가 결과에서는 예산 상태를 확정하지 않고 보건소 확인 질문으로 전환한다.',
    sourceLabel: '서울시/자치구 보건소 안내 종합',
    sourceUrl: 'https://seoul-agi.seoul.go.kr/ifc-csp',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.65,
  },
  {
    id: 'source-confidence',
    sido: '서울특별시',
    sigungu: null,
    topic: '정책신뢰도',
    text: '정책 데이터의 confidence가 낮거나 fallback 자료일 때는 금액과 신청 가능 여부를 확정하지 않는다. 최신 공지와 담당 부서 확인을 결과에 포함한다.',
    sourceLabel: 'Fevio policy source rule',
    sourceUrl: 'https://seoul-agi.seoul.go.kr/ifc-csp',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.6,
  },
] as const satisfies readonly PolicyRagChunk[];
