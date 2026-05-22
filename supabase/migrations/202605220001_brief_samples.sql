-- Daily Brief telemetry. Reflection body is intentionally not modeled.

create table if not exists public.brief_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  surface text not null check (surface in ('home_daily_brief', 'partner_brief', 'reflection_turn')),
  confirmed_phase text,
  phase_care_day text,
  fallback_used boolean not null default false,
  guard_rejected boolean not null default false,
  reflection_opened boolean not null default false,
  reflection_submitted boolean not null default false,
  dwell_ms integer not null default 0 check (dwell_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists brief_samples_created_at_idx
  on public.brief_samples(created_at desc);

create index if not exists brief_samples_user_created_at_idx
  on public.brief_samples(user_id, created_at desc);

alter table public.brief_samples enable row level security;

comment on table public.brief_samples is
  'Daily Brief and Reflection Turn telemetry. No free-text reflection body column is allowed.';
