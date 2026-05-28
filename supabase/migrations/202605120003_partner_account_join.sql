-- #198 Real partner account join into the shared care cycle.
-- Partner links remain token-gated for projection, but accepting a link now binds
-- an authenticated partner account to the couple's current treatment cycle.

alter table public.partner_share_links
  add column if not exists accepted_by uuid references auth.users(id) on delete set null,
  add column if not exists accepted_at timestamptz;

create index if not exists partner_share_links_accepted_by_idx
  on public.partner_share_links(accepted_by)
  where accepted_by is not null;

create or replace function public.accept_partner_share_invite(p_token_hash text)
returns table (
  couple_id uuid,
  cycle_id uuid,
  partner_membership_id uuid,
  patient_membership_id uuid,
  sharing_scope text,
  permission_level text,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_link public.partner_share_links%rowtype;
  v_patient_member_id uuid;
  v_partner_member_id uuid;
  v_partner_user_id uuid;
  v_cycle_id uuid;
  v_patient_membership_id uuid;
  v_partner_membership_id uuid;
  v_accepted_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for partner invite acceptance' using errcode = '28000';
  end if;

  select * into v_link
  from public.partner_share_links psl
  where psl.token_hash = p_token_hash
  limit 1;

  if v_link.id is null then
    raise exception 'partner_invite_not_found' using errcode = 'P0002';
  end if;

  if v_link.revoked_at is not null then
    raise exception 'partner_invite_revoked' using errcode = 'P0002';
  end if;

  if v_link.expires_at <= now() then
    raise exception 'partner_invite_expired' using errcode = 'P0002';
  end if;

  if v_link.created_by = v_user_id then
    raise exception 'partner_invite_own_link' using errcode = '23514';
  end if;

  if v_link.accepted_by is not null and v_link.accepted_by <> v_user_id then
    raise exception 'partner_invite_already_used' using errcode = '23505';
  end if;

  if exists (
    select 1 from public.couple_members cm
    where cm.user_id = v_user_id
      and cm.couple_id <> v_link.couple_id
  ) then
    raise exception 'partner_invite_user_already_bound' using errcode = '23505';
  end if;

  select au.email into v_email
  from auth.users au
  where au.id = v_user_id;

  select cm.id into v_patient_member_id
  from public.couple_members cm
  where cm.couple_id = v_link.couple_id
    and cm.role = 'primary'
  limit 1;

  if v_patient_member_id is null then
    raise exception 'partner_invite_patient_member_missing' using errcode = 'P0002';
  end if;

  select cm.id, cm.user_id into v_partner_member_id, v_partner_user_id
  from public.couple_members cm
  where cm.couple_id = v_link.couple_id
    and cm.role = 'partner'
  limit 1;

  if v_partner_member_id is null then
    insert into public.couple_members(couple_id, user_id, role, email)
    values (v_link.couple_id, v_user_id, 'partner', v_email)
    returning id into v_partner_member_id;
  elsif v_partner_user_id is null then
    update public.couple_members
    set user_id = v_user_id,
        email = coalesce(v_email, email)
    where id = v_partner_member_id;
  elsif v_partner_user_id <> v_user_id then
    raise exception 'partner_invite_partner_slot_occupied' using errcode = '23505';
  end if;

  select tc.id into v_cycle_id
  from public.treatment_cycles tc
  where tc.couple_id = v_link.couple_id
  order by tc.cycle_number desc, tc.started_at desc
  limit 1;

  if v_cycle_id is null then
    insert into public.treatment_cycles(couple_id, cycle_number, started_at)
    values (v_link.couple_id, 1, current_date)
    on conflict (couple_id, cycle_number) do update
      set updated_at = now()
    returning id into v_cycle_id;
  end if;

  insert into public.care_memberships(
    cycle_id,
    couple_id,
    couple_member_id,
    user_id,
    role,
    sharing_scope,
    permission_level
  ) values (
    v_cycle_id,
    v_link.couple_id,
    v_patient_member_id,
    v_link.created_by,
    'patient',
    'care',
    'assist_action'
  ) on conflict (cycle_id, role) do update
    set couple_member_id = excluded.couple_member_id,
        user_id = excluded.user_id,
        updated_at = now()
  returning id into v_patient_membership_id;

  insert into public.care_memberships(
    cycle_id,
    couple_id,
    couple_member_id,
    user_id,
    role,
    sharing_scope,
    permission_level
  ) values (
    v_cycle_id,
    v_link.couple_id,
    v_partner_member_id,
    v_user_id,
    'partner',
    'care',
    'assist_action'
  ) on conflict (cycle_id, role) do update
    set couple_member_id = excluded.couple_member_id,
        user_id = excluded.user_id,
        sharing_scope = excluded.sharing_scope,
        permission_level = excluded.permission_level,
        updated_at = now()
  returning id into v_partner_membership_id;

  update public.partner_share_links psl
  set accepted_by = coalesce(psl.accepted_by, v_user_id),
      accepted_at = coalesce(psl.accepted_at, v_accepted_at)
  where psl.id = v_link.id
  returning psl.accepted_at into v_accepted_at;

  return query select
    v_link.couple_id,
    v_cycle_id,
    v_partner_membership_id,
    v_patient_membership_id,
    'care'::text,
    'assist_action'::text,
    v_accepted_at;
end;
$$;

revoke all on function public.accept_partner_share_invite(text) from public;
grant execute on function public.accept_partner_share_invite(text) to authenticated;

comment on column public.partner_share_links.accepted_by is
  'Authenticated partner account that consumed this invite. Used to keep invite acceptance single-use.';
comment on column public.partner_share_links.accepted_at is
  'First successful authenticated account join time for the partner invite.';
comment on function public.accept_partner_share_invite(text) is
  'Accepts a hashed partner invite token for the current auth.uid(), binds the partner member, ensures a treatment cycle, and creates patient/partner care_memberships without granting medical edit access.';
