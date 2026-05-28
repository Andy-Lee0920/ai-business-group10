-- #156-#165 Fevio Care OS architecture completion primitives.
-- Adds explicit care-cycle memberships, patient-owned sharing scope,
-- partner assist permission, and injection trust ledger structures.

create table if not exists public.care_memberships (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.treatment_cycles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  couple_member_id uuid references public.couple_members(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'partner')),
  sharing_scope text not null default 'care' check (sharing_scope in ('basic', 'care', 'emotional')),
  permission_level text not null default 'read' check (permission_level in ('read', 'soft_action', 'assist_action')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, role),
  unique (cycle_id, user_id)
);

create table if not exists public.injection_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.care_action_cards(id) on delete cascade,
  cycle_id uuid references public.treatment_cycles(id) on delete set null,
  couple_id uuid not null references public.couples(id) on delete cascade,
  scheduled_time timestamptz not null,
  actual_time timestamptz,
  administered_by uuid references public.couple_members(id) on delete set null,
  recorded_by uuid not null references public.couple_members(id) on delete restrict,
  confirmed_by_patient boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((confirmed_by_patient = false and confirmed_at is null) or (confirmed_by_patient = true and confirmed_at is not null))
);

create index if not exists care_memberships_cycle_role_idx on public.care_memberships(cycle_id, role);
create index if not exists care_memberships_couple_user_idx on public.care_memberships(couple_id, user_id);
create index if not exists injection_logs_card_idx on public.injection_logs(card_id);
create index if not exists injection_logs_couple_time_idx on public.injection_logs(couple_id, scheduled_time desc);

create or replace function public.ensure_care_membership_matches_cycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.treatment_cycles tc
    where tc.id = new.cycle_id and tc.couple_id = new.couple_id
  ) then
    raise exception 'care_memberships.couple_id must match treatment cycle.' using errcode = '23514';
  end if;

  if new.couple_member_id is not null and not exists (
    select 1 from public.couple_members cm
    where cm.id = new.couple_member_id and cm.couple_id = new.couple_id
  ) then
    raise exception 'care_memberships.couple_member_id must belong to the same couple.' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists care_memberships_match_cycle on public.care_memberships;
create trigger care_memberships_match_cycle
  before insert or update on public.care_memberships
  for each row execute function public.ensure_care_membership_matches_cycle();

create or replace function public.record_partner_assisted_injection(
  p_token_hash text,
  p_card_id uuid,
  p_actual_time timestamptz
)
returns table (
  injection_log_id uuid,
  confirmed_by_patient boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.partner_share_links%rowtype;
  v_card public.care_action_cards%rowtype;
  v_partner_member_id uuid;
  v_log_id uuid;
begin
  select * into v_link
  from public.partner_share_links psl
  where psl.token_hash = p_token_hash
    and psl.revoked_at is null
    and psl.expires_at > now();

  if v_link.id is null then
    raise exception 'partner link not found' using errcode = 'P0002';
  end if;

  select * into v_card
  from public.care_action_cards c
  where c.id = p_card_id
    and c.couple_id = v_link.couple_id
    and c.card_type = 'injection'
    and c.partner_visible = true;

  if v_card.id is null then
    raise exception 'partner-visible injection card not found' using errcode = 'P0002';
  end if;

  select cm.id into v_partner_member_id
  from public.couple_members cm
  where cm.couple_id = v_link.couple_id and cm.role = 'partner'
  limit 1;

  if v_partner_member_id is null then
    raise exception 'partner member not found' using errcode = 'P0002';
  end if;

  insert into public.injection_logs(
    card_id,
    couple_id,
    scheduled_time,
    actual_time,
    administered_by,
    recorded_by,
    confirmed_by_patient
  ) values (
    v_card.id,
    v_card.couple_id,
    coalesce(v_card.scheduled_at, now()),
    p_actual_time,
    v_partner_member_id,
    v_partner_member_id,
    false
  ) returning id into v_log_id;

  return query select v_log_id, false;
end;
$$;

create or replace function public.confirm_injection_log_by_patient(p_log_id uuid)
returns table (
  injection_log_id uuid,
  confirmed_by_patient boolean,
  confirmed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_confirmed_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for patient confirmation' using errcode = '28000';
  end if;

  update public.injection_logs il
  set confirmed_by_patient = true,
      confirmed_at = v_confirmed_at,
      updated_at = v_confirmed_at
  where il.id = p_log_id
    and il.couple_id in (select public.current_user_couple_ids())
  returning il.id into p_log_id;

  if p_log_id is null then
    raise exception 'injection log not found' using errcode = 'P0002';
  end if;

  return query select p_log_id, true, v_confirmed_at;
end;
$$;

alter table public.care_memberships enable row level security;
alter table public.injection_logs enable row level security;

create policy "care_memberships_select_own" on public.care_memberships
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "care_memberships_insert_own_after_privacy" on public.care_memberships
  for insert to authenticated
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "care_memberships_update_own" on public.care_memberships
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

create policy "injection_logs_select_own" on public.injection_logs
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "injection_logs_insert_own_after_privacy" on public.injection_logs
  for insert to authenticated
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "injection_logs_update_own" on public.injection_logs
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

revoke all on function public.record_partner_assisted_injection(text, uuid, timestamptz) from public;
revoke all on function public.confirm_injection_log_by_patient(uuid) from public;

grant select, insert, update on public.care_memberships to authenticated;
grant select, insert, update on public.injection_logs to authenticated;
grant execute on function public.record_partner_assisted_injection(text, uuid, timestamptz) to anon, authenticated;
grant execute on function public.confirm_injection_log_by_patient(uuid) to authenticated;

comment on table public.care_memberships is
  'Care-cycle role membership. One shared treatment cycle can produce different patient and partner experiences.';
comment on column public.care_memberships.sharing_scope is
  'Patient-owned partner projection scope: basic, care, or emotional.';
comment on column public.care_memberships.permission_level is
  'Partner assist permission ladder. Full medical edit access is intentionally absent.';
comment on table public.injection_logs is
  'Trust ledger for injection completion: who administered, who recorded, and whether patient confirmed.';
