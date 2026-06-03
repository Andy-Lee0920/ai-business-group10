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

type VectorRetrieveInput = RetrievePolicyEvidenceInput & {
  supabaseUrl: string;
  supabaseKey: string;
  openAiApiKey: string;
};

// ─── 공개 진입점 ──────────────────────────────────────────────────────────────

/**
 * 동기 static fallback — API 키 없이 항상 동작한다.
 * page.tsx useMemo, 테스트에서 사용.
 */
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
    .sort((l, r) => r.score - l.score || r.chunk.confidence - l.chunk.confidence)
    .slice(0, limit);

  return scored.map(chunkToEvidence);
}

/**
 * 비동기 vector search — OPENAI_API_KEY + Supabase 연결 시 사용.
 * API route에서 호출. 실패하면 static fallback으로 내려간다.
 */
export async function retrievePolicyEvidenceVector(
  input: VectorRetrieveInput,
): Promise<{ evidence: PolicyEvidence[]; mode: 'vector' | 'static_rag' }> {
  try {
    const evidence = await vectorSearch(input);
    if (evidence.length > 0) return { evidence, mode: 'vector' };
  } catch {
    // vector search 실패 → static fallback
  }

  return {
    evidence: retrievePolicyEvidence(input),
    mode: 'static_rag',
  };
}

// ─── Vector search ────────────────────────────────────────────────────────────

async function vectorSearch({
  sido,
  sigungu,
  conditionChecks,
  limit = 6,
  supabaseUrl,
  supabaseKey,
  openAiApiKey,
}: VectorRetrieveInput): Promise<PolicyEvidence[]> {
  const topics = Array.from(topicsFromChecks(conditionChecks));
  const queryText = buildQueryText(sigungu, conditionChecks);
  const embedding = await fetchEmbedding(queryText, openAiApiKey);

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/match_policy_embeddings`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_embedding: embedding,
      filter_sido: sido,
      filter_sigungu: sigungu,
      filter_topics: topics,
      match_threshold: 0.65,
      match_count: limit,
    }),
  });

  if (!res.ok) throw new Error(`match_policy_embeddings RPC ${res.status}`);

  const rows = (await res.json()) as Array<{
    id: string;
    topic: string;
    chunk_text: string;
    source_label: string;
    source_url: string;
    last_verified_at: string;
    confidence: number;
    similarity: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    topic: row.topic as PolicyRagTopic,
    text: row.chunk_text,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    confidence: row.confidence,
  }));
}

async function fetchEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
  });

  if (!res.ok) throw new Error(`OpenAI embeddings ${res.status}`);

  const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
  const vec = json.data[0]?.embedding;
  if (!Array.isArray(vec) || vec.length === 0) throw new Error('empty embedding vector');
  return vec;
}

// ─── 공통 유틸 ────────────────────────────────────────────────────────────────

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

function buildQueryText(
  sigungu: string,
  conditionChecks: readonly PolicyConditionCheck[],
): string {
  const attentionItems = conditionChecks
    .filter((c) => c.status !== 'confirmed')
    .map((c) => c.item);

  if (attentionItems.length === 0) {
    return `${sigungu} 난임부부 시술비 지원 신청 방법`;
  }

  return `${sigungu} 난임부부 시술비 지원: ${attentionItems.join(', ')} 확인 필요`;
}

function scoreChunk(chunk: PolicyRagChunk, sigungu: string): number {
  let score = chunk.confidence;
  if (chunk.sigungu === sigungu) score += 1;
  if (chunk.sigungu === null) score += 0.2;
  return score;
}

function chunkToEvidence(
  { chunk }: { chunk: PolicyRagChunk },
): PolicyEvidence {
  return {
    id: chunk.id,
    topic: chunk.topic,
    text: chunk.text,
    sourceLabel: chunk.sourceLabel,
    sourceUrl: chunk.sourceUrl,
    lastVerifiedAt: chunk.lastVerifiedAt,
    confidence: chunk.confidence,
  };
}
