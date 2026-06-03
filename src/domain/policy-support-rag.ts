import { STATIC_POLICY_RAG_CHUNKS, type PolicyRagChunk, type PolicyRagTopic } from '../data/policy-rag/static-chunks';
import type { PolicyConditionCheck } from './policy-support';

export type PolicyEvidence = {
  id: string;
  topic: PolicyRagTopic;
  text: string;
  sourceLabel: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  confidence: number;
};

type RetrievePolicyEvidenceInput = {
  sido: string;
  sigungu: string;
  conditionChecks: readonly PolicyConditionCheck[];
  limit?: number;
};

export function retrievePolicyEvidence({
  sido,
  sigungu,
  conditionChecks,
  limit = 6,
}: RetrievePolicyEvidenceInput): PolicyEvidence[] {
  const topics = topicsFromChecks(conditionChecks);
  const scored = STATIC_POLICY_RAG_CHUNKS
    .filter((chunk) => chunk.sido === sido && (chunk.sigungu === null || chunk.sigungu === sigungu))
    .filter((chunk) => topics.has(chunk.topic))
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, sigungu) }))
    .sort((left, right) => right.score - left.score || right.chunk.confidence - left.chunk.confidence)
    .slice(0, limit);

  return scored.map(({ chunk }) => ({
    id: chunk.id,
    topic: chunk.topic,
    text: chunk.text,
    sourceLabel: chunk.sourceLabel,
    sourceUrl: chunk.sourceUrl,
    lastVerifiedAt: chunk.lastVerifiedAt,
    confidence: chunk.confidence,
  }));
}

function topicsFromChecks(conditionChecks: readonly PolicyConditionCheck[]): Set<PolicyRagTopic> {
  const topics = new Set<PolicyRagTopic>();

  for (const check of conditionChecks) {
    if (check.status === 'confirmed') continue;
    if (check.item === '지원결정통지서') topics.add('지원결정통지서');
    if (check.item === '예산') topics.add('예산');
    if (check.item === '원외약제비') topics.add('원외약제비');
    if (check.item === '지원 횟수') topics.add('지원대상');
    if (check.item === '난임진단서') topics.add('서류');
    if (check.item === '정책 데이터 신뢰도') topics.add('정책신뢰도');
  }

  topics.add('신청방법');
  return topics;
}

function scoreChunk(chunk: PolicyRagChunk, sigungu: string): number {
  let score = chunk.confidence;
  if (chunk.sigungu === sigungu) score += 1;
  if (chunk.sigungu === null) score += 0.2;
  return score;
}
