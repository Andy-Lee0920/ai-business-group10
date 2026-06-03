-- pgvector extension (Supabase에 기본 제공)
create extension if not exists vector;

create table if not exists policy_embeddings (
  id            uuid primary key default gen_random_uuid(),
  sido          text not null,
  sigungu       text,               -- null = 시도 전체 기준
  topic         text not null,
  chunk_text    text not null,
  embedding     vector(1536),       -- OpenAI text-embedding-3-small
  confidence    float not null default 0.7,
  source_label  text not null,
  source_url    text not null,
  last_verified_at text not null,
  created_at    timestamptz default now()
);

-- 자치구 + topic 복합 인덱스 (필터링 성능)
create index if not exists policy_embeddings_sido_sigungu_idx
  on policy_embeddings (sido, sigungu);

-- 코사인 유사도 IVFFlat 인덱스
create index if not exists policy_embeddings_embedding_idx
  on policy_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- RLS: 정책 정보는 공개 읽기 허용 (개인 의료 데이터 아님)
alter table policy_embeddings enable row level security;

create policy "policy_embeddings_public_read"
  on policy_embeddings for select
  using (true);

-- Vector similarity search RPC
create or replace function match_policy_embeddings(
  query_embedding  vector(1536),
  filter_sido      text,
  filter_sigungu   text,
  filter_topics    text[],
  match_threshold  float default 0.65,
  match_count      int   default 6
)
returns table (
  id               uuid,
  sido             text,
  sigungu          text,
  topic            text,
  chunk_text       text,
  source_label     text,
  source_url       text,
  last_verified_at text,
  confidence       float,
  similarity       float
)
language sql stable
as $$
  select
    pe.id,
    pe.sido,
    pe.sigungu,
    pe.topic,
    pe.chunk_text,
    pe.source_label,
    pe.source_url,
    pe.last_verified_at,
    pe.confidence,
    1 - (pe.embedding <=> query_embedding) as similarity
  from policy_embeddings pe
  where
    pe.sido = filter_sido
    and (pe.sigungu is null or pe.sigungu = filter_sigungu)
    and pe.topic = any(filter_topics)
    and 1 - (pe.embedding <=> query_embedding) > match_threshold
  order by
    pe.embedding <=> query_embedding,
    case when pe.sigungu = filter_sigungu then 0 else 1 end
  limit match_count;
$$;
