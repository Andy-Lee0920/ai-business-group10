import type { PolicyStructuredSeed } from '../types/policy-support.types';
import type { PolicyRagTopic } from '../data/policy-rag/static-chunks';

export type PolicySeedChunk = {
  sido: string;
  sigungu: string | null;
  topic: PolicyRagTopic;
  chunkText: string;
  confidence: number;
  sourceLabel: string;
  sourceUrl: string;
  lastVerifiedAt: string;
};

export function chunkPolicySeed(seed: PolicyStructuredSeed): PolicySeedChunk[] {
  const label = seed.sigungu
    ? `${seed.sigungu} 난임부부 시술비 지원`
    : `${seed.sido} 난임부부 시술비 지원`;

  const base = {
    sido: seed.sido,
    sigungu: seed.sigungu,
    confidence: seed.confidence,
    sourceLabel: `${label} 안내`,
    sourceUrl: seed.source_url,
    lastVerifiedAt: seed.last_verified_at,
  };

  const chunks: PolicySeedChunk[] = [];

  // 지원결정통지서
  if (seed.require_decision_notice) {
    const applyBefore = seed.apply_before_treatment
      ? '시술 시작 전에 신청해야 한다.'
      : '시술 전후 신청 가능 여부는 보건소 확인이 필요하다.';
    chunks.push({
      ...base,
      topic: '지원결정통지서',
      chunkText: `${label}: 지원결정통지서 발급이 필요하다. ${applyBefore} e보건소 또는 관할 보건소에서 신청 가능하다. 출처: ${seed.source_url}`,
    });
  }

  // 지원금액
  const amounts: string[] = [];
  if (seed.ivf_fresh_limit !== null)
    amounts.push(`신선배아 최대 ${seed.ivf_fresh_limit.toLocaleString('ko-KR')}원`);
  if (seed.ivf_frozen_limit !== null)
    amounts.push(`동결배아 최대 ${seed.ivf_frozen_limit.toLocaleString('ko-KR')}원`);
  if (seed.iui_limit !== null)
    amounts.push(`인공수정 최대 ${seed.iui_limit.toLocaleString('ko-KR')}원`);
  if (amounts.length > 0) {
    chunks.push({
      ...base,
      topic: '지원금액',
      chunkText: `${label} 지원 상한: ${amounts.join(', ')}. 실제 금액은 시술 회차와 보건소 결정에 따라 다를 수 있다.`,
    });
  }

  // 서류
  if (seed.required_documents.length > 0) {
    chunks.push({
      ...base,
      topic: '서류',
      chunkText: `${label} 필요 서류: ${seed.required_documents.join(', ')}. 최신 목록은 관할 보건소에서 확인해야 한다.`,
    });
  }

  // 원외약제비
  const drugText =
    seed.drug_external_covered === true
      ? `${label}: 원외약제비 지원 가능성이 있다. 청구 서류와 기한을 보건소에서 확인해야 한다.`
      : seed.drug_external_covered === false
        ? `${label}: 현재 정책에서 원외약제비 지원 제외 가능성이 표시되어 있다. 보건소에서 직접 확인이 필요하다.`
        : `${label}: 원외약제비 지원 여부는 구별로 상이하다. 관할 보건소에 직접 확인해야 한다.`;
  chunks.push({ ...base, topic: '원외약제비', chunkText: drugText });

  // 예산
  const budgetText = seed.budget_exhausted
    ? `${label}: 예산 소진 또는 접수 마감 가능성이 있다. ${seed.budget_notice ?? '관할 보건소에 현재 접수 가능 여부를 확인해야 한다.'}`
    : `${label}: 예산 접수 가능 상태로 확인되어 있다. 정보 기준일은 ${seed.budget_checked_at}이며 최신 여부는 보건소에서 확인해야 한다.`;
  chunks.push({ ...base, topic: '예산', chunkText: budgetText });

  // 신청방법
  const applyMethod = seed.online_apply_available
    ? `${label}: e보건소(${seed.apply_url ?? 'https://www.e-health.go.kr'}) 또는 관할 보건소 방문 신청이 가능하다.`
    : `${label}: 관할 보건소 방문 신청이 필요하다. 온라인 신청 가능 여부는 보건소에서 확인해야 한다.`;
  chunks.push({ ...base, topic: '신청방법', chunkText: applyMethod });

  // 연락처
  if (seed.health_center_name && (seed.contact_phone ?? seed.contact_email)) {
    const contact = [
      seed.contact_phone ? `전화: ${seed.contact_phone}` : null,
      seed.contact_email ? `이메일: ${seed.contact_email}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    chunks.push({
      ...base,
      topic: '연락처',
      chunkText: `${seed.health_center_name} ${seed.dept_name ?? '모자보건 담당 부서'} — ${contact}`,
    });
  }

  // 정책 신뢰도
  if (seed.confidence < 0.7) {
    chunks.push({
      ...base,
      topic: '정책신뢰도',
      chunkText: `${label} 정책 데이터는 폴백 또는 낮은 신뢰도 자료다(confidence: ${seed.confidence}). 최종 내용은 관할 보건소에서 직접 확인해야 한다.`,
    });
  }

  return chunks;
}
