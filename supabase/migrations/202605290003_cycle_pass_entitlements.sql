-- Cycle Pass entitlement storage.
-- This stores the user's bounded cycle unlock state without committing to a payment provider.

create table if not exists public.cycle_pass_entitlements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  cycle_id uuid not null references public.treatment_cycles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked')),
  source text not null
    check (source in ('manual_code', 'provider', 'admin')),
  active_from date not null,
  active_until date not null,
  provider_reference_hash text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (active_until >= active_from),
  check (provider_reference_hash is null or length(provider_reference_hash) >= 20)
);

create unique index if not exists cycle_pass_entitlements_active_cycle_user_idx
  on public.cycle_pass_entitlements(cycle_id, user_id)
  where status = 'active' and revoked_at is null;

create index if not exists cycle_pass_entitlements_user_window_idx
  on public.cycle_pass_entitlements(user_id, active_from, active_until)
  where status = 'active' and revoked_at is null;

alter table public.cycle_pass_entitlements enable row level security;

create policy "cycle_pass_entitlements_select_own" on public.cycle_pass_entitlements
  for select using (auth.uid() = user_id);

grant select on public.cycle_pass_entitlements to authenticated;
grant select, insert, update, delete on public.cycle_pass_entitlements to service_role;

comment on table public.cycle_pass_entitlements is
  'Bounded Cycle Pass unlock state for one treatment cycle. Authenticated users may read their own entitlement, but creation/revocation must stay behind service-role provider/admin validation.';
comment on column public.cycle_pass_entitlements.provider_reference_hash is
  'Optional hash of a provider/reference id. Raw payment identifiers or secrets must not be stored here.';
