-- #23 Auth + Privacy Gate bootstrap baseline.
-- Creates the couple shell owned by the authenticated primary user and stores
-- privacy-gate acceptance separately from future sensitive data tables.

create extension if not exists pgcrypto;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('primary', 'partner')),
  email text,
  created_at timestamptz not null default now(),
  unique (couple_id, role)
);

create unique index if not exists couple_members_user_id_unique
  on public.couple_members(user_id)
  where user_id is not null;

create table if not exists public.couple_states (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  privacy_gate_accepted_at timestamptz,
  privacy_gate_accepted_by uuid references auth.users(id),
  privacy_gate_version text,
  first_capture_completed_at timestamptz,
  waiting_mode_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_states enable row level security;

create or replace function public.current_user_couple_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.couple_id
  from public.couple_members cm
  where cm.user_id = auth.uid()
$$;

create policy "couples_select_own" on public.couples
  for select to authenticated
  using (id in (select public.current_user_couple_ids()));

create policy "couple_members_select_own" on public.couple_members
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "couple_states_select_own" on public.couple_states
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "couple_states_update_own" on public.couple_states
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

create or replace function public.init_couple_for_user()
returns table (
  couple_id uuid,
  primary_member_id uuid,
  partner_member_id uuid,
  privacy_gate_accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_couple_id uuid;
  v_primary_member_id uuid;
  v_partner_member_id uuid;
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for couple bootstrap' using errcode = '28000';
  end if;

  select au.email into v_email
  from auth.users au
  where au.id = v_user_id;

  select cm.couple_id, cm.id
    into v_couple_id, v_primary_member_id
  from public.couple_members cm
  where cm.user_id = v_user_id and cm.role = 'primary'
  limit 1;

  if v_couple_id is null then
    insert into public.couples(created_by)
    values (v_user_id)
    returning id into v_couple_id;

    insert into public.couple_members(couple_id, user_id, role, email)
    values (v_couple_id, v_user_id, 'primary', v_email)
    returning id into v_primary_member_id;

    insert into public.couple_members(couple_id, user_id, role, email)
    values (v_couple_id, null, 'partner', null)
    returning id into v_partner_member_id;

    insert into public.couple_states(couple_id)
    values (v_couple_id)
    on conflict (couple_id) do nothing;
  else
    select cm.id into v_partner_member_id
    from public.couple_members cm
    where cm.couple_id = v_couple_id and cm.role = 'partner'
    limit 1;

    if v_partner_member_id is null then
      insert into public.couple_members(couple_id, user_id, role, email)
      values (v_couple_id, null, 'partner', null)
      returning id into v_partner_member_id;
    end if;

    insert into public.couple_states(couple_id)
    values (v_couple_id)
    on conflict (couple_id) do nothing;
  end if;

  return query
  select v_couple_id, v_primary_member_id, v_partner_member_id, cs.privacy_gate_accepted_at
  from public.couple_states cs
  where cs.couple_id = v_couple_id;
end;
$$;

create or replace function public.accept_privacy_gate(p_version text default 'v1.0-slc')
returns table (
  couple_id uuid,
  privacy_gate_accepted_at timestamptz,
  privacy_gate_version text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for privacy gate acceptance' using errcode = '28000';
  end if;

  select cm.couple_id into v_couple_id
  from public.couple_members cm
  where cm.user_id = v_user_id and cm.role = 'primary'
  limit 1;

  if v_couple_id is null then
    raise exception 'couple shell missing for user' using errcode = 'P0002';
  end if;

  update public.couple_states cs
  set privacy_gate_accepted_at = coalesce(cs.privacy_gate_accepted_at, now()),
      privacy_gate_accepted_by = coalesce(cs.privacy_gate_accepted_by, v_user_id),
      privacy_gate_version = coalesce(cs.privacy_gate_version, p_version),
      updated_at = now()
  where cs.couple_id = v_couple_id;

  return query
  select cs.couple_id, cs.privacy_gate_accepted_at, cs.privacy_gate_version
  from public.couple_states cs
  where cs.couple_id = v_couple_id;
end;
$$;

create or replace function public.can_create_sensitive_rows(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_states cs
    where cs.couple_id = p_couple_id
      and cs.privacy_gate_accepted_at is not null
      and p_couple_id in (select public.current_user_couple_ids())
  )
$$;

revoke all on function public.current_user_couple_ids() from public;
revoke all on function public.init_couple_for_user() from public;
revoke all on function public.accept_privacy_gate(text) from public;
revoke all on function public.can_create_sensitive_rows(uuid) from public;

grant select on public.couples to authenticated;
grant select on public.couple_members to authenticated;
grant select, update on public.couple_states to authenticated;

grant execute on function public.current_user_couple_ids() to authenticated;
grant execute on function public.init_couple_for_user() to authenticated;
grant execute on function public.accept_privacy_gate(text) to authenticated;
grant execute on function public.can_create_sensitive_rows(uuid) to authenticated;
