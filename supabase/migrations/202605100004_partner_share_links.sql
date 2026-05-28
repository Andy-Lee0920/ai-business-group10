-- #27 / #53 Partner share links and sanitized partner projection.
-- Raw partner tokens are never stored; only SHA-256 token_hash is persisted.

create table if not exists public.partner_share_links (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create unique index if not exists partner_share_links_one_active_idx
  on public.partner_share_links(couple_id)
  where revoked_at is null;

create table if not exists public.partner_share_events (
  id uuid primary key default gen_random_uuid(),
  partner_share_link_id uuid not null references public.partner_share_links(id) on delete cascade,
  card_id uuid not null references public.care_action_cards(id) on delete cascade,
  card_revision_seen integer not null check (card_revision_seen > 0),
  card_updated_at_seen timestamptz,
  acknowledged_at timestamptz not null default now()
);

alter table public.partner_share_links enable row level security;
alter table public.partner_share_events enable row level security;

create policy "partner_share_links_select_own" on public.partner_share_links
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "partner_share_links_insert_own_after_privacy" on public.partner_share_links
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "partner_share_links_update_own" on public.partner_share_links
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

create policy "partner_share_events_select_own" on public.partner_share_events
  for select to authenticated
  using (
    partner_share_link_id in (
      select psl.id from public.partner_share_links psl
      where psl.couple_id in (select public.current_user_couple_ids())
    )
  );


create or replace function public.is_partner_share_link_usable(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_share_links psl
    where psl.token_hash = p_token_hash
      and psl.revoked_at is null
      and psl.expires_at > now()
  )
$$;

create or replace function public.get_partner_action_view(p_token_hash text)
returns table (
  title text,
  scheduled_at timestamptz,
  card_type text,
  description text,
  display_state text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.title,
    c.scheduled_at,
    c.card_type,
    c.description,
    case c.status
      when 'completed' then 'completed'
      when 'revoked' then 'revoked'
      when 'superseded' then 'superseded'
      else 'current'
    end as display_state
  from public.partner_share_links psl
  join public.care_action_cards c on c.couple_id = psl.couple_id
  where psl.token_hash = p_token_hash
    and psl.revoked_at is null
    and psl.expires_at > now()
    and c.partner_visible = true
    and c.status in ('confirmed', 'completed', 'revoked', 'superseded')
  order by c.scheduled_at nulls last, c.created_at;
$$;

revoke all on function public.is_partner_share_link_usable(text) from public;
revoke all on function public.get_partner_action_view(text) from public;
grant select, insert, update on public.partner_share_links to authenticated;
grant select on public.partner_share_events to authenticated;
grant execute on function public.is_partner_share_link_usable(text) to anon, authenticated;
grant execute on function public.get_partner_action_view(text) to anon, authenticated;

comment on table public.partner_share_links is
  'Couple-level 7-day partner share links. Stores SHA-256 token_hash only, never raw tokens.';
comment on function public.is_partner_share_link_usable(text) is
  'Returns whether a SHA-256 partner token hash maps to a non-expired, non-revoked share link.';
comment on function public.get_partner_action_view(text) is
  'Sanitized live partner projection. Returns only title, scheduled_at, card_type, description, display_state.';
