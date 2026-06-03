/**
 * 일회성 실행 스크립트 — policy-seed 데이터를 청크로 변환하고
 * OpenAI 임베딩을 생성해 Supabase policy_embeddings 테이블에 적재한다.
 *
 * 사용법:
 *   OPENAI_API_KEY=sk-... \
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-policy-embeddings.mjs
 *
 * 옵션:
 *   --dry-run   임베딩 생성 없이 청크 목록만 출력
 *   --district  특정 자치구만 처리 (예: --district=강남구)
 */

import { createClient } from '@supabase/supabase-js';

// ─── 환경변수 검증 ───────────────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const isDryRun = process.argv.includes('--dry-run');
const districtFilter = process.argv
  .find((a) => a.startsWith('--district='))
  ?.split('=')[1];

if (!isDryRun && !OPENAI_API_KEY) {
  console.error('❌  OPENAI_API_KEY 가 설정되지 않았습니다. --dry-run 으로 테스트하세요.');
  process.exit(1);
}
if (!isDryRun && (!SUPABASE_URL || !SERVICE_ROLE_KEY)) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.');
  process.exit(1);
}

// ─── 시드 데이터 로드 ─────────────────────────────────────────────────────────
// 참고: tsx 없이 mjs에서 ts 임포트 불가 → 시드 데이터를 inline으로 참조
// 실제 운영 시에는 tsx 또는 ts-node로 실행하거나 빌드 아웃풋을 참조한다.
// 여기서는 ts 파일을 dynamic import 로 처리 (Node 22 + 프로젝트 tsconfig ESM)

let seeds;
try {
  const { getPolicySeed } = await import('../src/data/policy-seed/index.ts');
  const DISTRICTS = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구',
  ];

  const filtered = districtFilter
    ? DISTRICTS.filter((d) => d === districtFilter)
    : DISTRICTS;

  seeds = filtered.map((district) => ({
    district,
    seed: getPolicySeed('서울특별시', district),
  }));
} catch (err) {
  console.error('❌  시드 데이터 로드 실패. tsx로 실행 필요:', err.message);
  process.exit(1);
}

// ─── 청크 생성 ────────────────────────────────────────────────────────────────
const { chunkPolicySeed } = await import('../src/domain/policy-seed-chunker.ts').catch(() => {
  console.error('❌  policy-seed-chunker.ts 로드 실패. tsx로 실행해 주세요.');
  process.exit(1);
});

const allChunks = seeds.flatMap(({ district, seed }) =>
  chunkPolicySeed(seed).map((chunk) => ({ ...chunk, district })),
);

console.log(`\n청크 생성 완료: ${allChunks.length}개`);

if (isDryRun) {
  for (const chunk of allChunks) {
    console.log(`  [${chunk.district ?? '서울 공통'}] ${chunk.topic} — ${chunk.chunkText.slice(0, 60)}...`);
  }
  console.log('\n✅  dry-run 완료. 실제 적재하려면 --dry-run 없이 실행하세요.');
  process.exit(0);
}

// ─── 임베딩 생성 ──────────────────────────────────────────────────────────────
async function getEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding;
}

// ─── Supabase 적재 ────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 기존 데이터 초기화
const { error: deleteError } = await supabase
  .from('policy_embeddings')
  .delete()
  .eq('sido', '서울특별시');

if (deleteError) {
  console.error('❌  기존 데이터 삭제 실패:', deleteError.message);
  process.exit(1);
}
console.log('기존 서울 policy_embeddings 삭제 완료\n');

let success = 0;
let failed = 0;

for (const chunk of allChunks) {
  process.stdout.write(`  임베딩 생성 중: [${chunk.sigungu ?? '공통'}] ${chunk.topic} ... `);

  try {
    const embedding = await getEmbedding(chunk.chunkText);

    const { error } = await supabase.from('policy_embeddings').insert({
      sido: chunk.sido,
      sigungu: chunk.sigungu,
      topic: chunk.topic,
      chunk_text: chunk.chunkText,
      embedding,
      confidence: chunk.confidence,
      source_label: chunk.sourceLabel,
      source_url: chunk.sourceUrl,
      last_verified_at: chunk.lastVerifiedAt,
    });

    if (error) throw new Error(error.message);

    console.log('✅');
    success++;

    // Rate limit 대비 간격
    await new Promise((r) => setTimeout(r, 120));
  } catch (err) {
    console.log('❌', err.message);
    failed++;
  }
}

console.log(`\n완료: 성공 ${success}개 / 실패 ${failed}개`);
if (failed > 0) process.exit(1);
