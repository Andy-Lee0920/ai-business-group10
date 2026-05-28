-- #199 Patient-owned sharing scope persistence.
-- Sharing scope is stored on care_memberships and read by the partner projection RPC.

create or replace function public.get_patient_sharing_scope()
returns table (
  cycle_id uuid,
  sharing_scope text,
  partner_connected boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cycle_id uuid;
  v_scope text;
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for sharing scope read' using errcode = '28000';
  end if;

  select cm.cycle_id, cm.sharing_scope
    into v_cycle_id, v_scope
  from public.care_memberships cm
  join public.treatment_cycles tc on tc.id = cm.cycle_id
  where cm.user_id = v_user_id
    and cm.role = 'patient'
  order by tc.cycle_number desc, tc.started_at desc, cm.joined_at desc
  limit 1;

  if v_cycle_id is null then
    raise exception 'patient_sharing_scope_not_found' using errcode = 'P0002';
  end if;

  return query select
    v_cycle_id,
    v_scope,
    exists (
      select 1 from public.care_memberships partner_cm
      where partner_cm.cycle_id = v_cycle_id
        and partner_cm.role = 'partner'
        and partner_cm.user_id is not null
    ) as partner_connected;
end;
$$;

create or replace function public.set_patient_sharing_scope(p_scope text)
returns table (
  cycle_id uuid,
  sharing_scope text,
  partner_connected boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cycle_id uuid;
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for sharing scope update' using errcode = '28000';
  end if;

  if not (p_scope in ('basic', 'care', 'emotional')) then
    raise exception 'invalid_patient_sharing_scope' using errcode = '23514';
  end if;

  select cm.cycle_id
    into v_cycle_id
  from public.care_memberships cm
  join public.treatment_cycles tc on tc.id = cm.cycle_id
  where cm.user_id = v_user_id
    and cm.role = 'patient'
  order by tc.cycle_number desc, tc.started_at desc, cm.joined_at desc
  limit 1;

  if v_cycle_id is null then
    raise exception 'patient_sharing_scope_not_found' using errcode = 'P0002';
  end if;

  update public.care_memberships
  set sharing_scope = p_scope,
      updated_at = now()
  where cycle_id = v_cycle_id
    and role in ('patient', 'partner');

  return query select
    v_cycle_id,
    p_scope,
    exists (
      select 1 from public.care_memberships partner_cm
      where partner_cm.cycle_id = v_cycle_id
        and partner_cm.role = 'partner'
        and partner_cm.user_id is not null
    ) as partner_connected;
end;
$$;

drop function if exists public.get_partner_action_view(text);

create function public.get_partner_action_view(p_token_hash text)
returns table (
  id uuid,
  title text,
  scheduled_at timestamptz,
  card_type text,
  description text,
  display_state text,
  revision integer,
  sharing_scope text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.title,
    c.scheduled_at,
    c.card_type,
    c.description,
    case c.status
      when 'completed' then 'completed'
      when 'revoked' then 'revoked'
      when 'superseded' then 'superseded'
      else 'current'
    end as display_state,
    c.revision,
    coalesce(scope_cm.sharing_scope, 'care') as sharing_scope
  from public.partner_share_links psl
  join public.care_action_cards c on c.couple_id = psl.couple_id
  left join lateral (
    select cm.sharing_scope
    from public.treatment_cycles tc
    join public.care_memberships cm on cm.cycle_id = tc.id
      and cm.couple_id = tc.couple_id
      and cm.role = 'partner'
    where tc.couple_id = psl.couple_id
    order by tc.cycle_number desc, tc.started_at desc, cm.joined_at desc
    limit 1
  ) scope_cm on true
  where psl.token_hash = p_token_hash
    and psl.revoked_at is null
    and psl.expires_at > now()
    and c.partner_visible = true
    and c.status in ('confirmed', 'completed', 'revoked', 'superseded')
  order by c.scheduled_at nulls last, c.created_at;
$$;

revoke all on function public.get_patient_sharing_scope() from public;
revoke all on function public.set_patient_sharing_scope(text) from public;
revoke all on function public.get_partner_action_view(text) from public;

grant execute on function public.get_patient_sharing_scope() to authenticated;
grant execute on function public.set_patient_sharing_scope(text) to authenticated;
grant execute on function public.get_partner_action_view(text) to anon, authenticated;

comment on function public.get_patient_sharing_scope() is
  'Returns the current patient-owned partner sharing scope for the latest care cycle.';
comment on function public.set_patient_sharing_scope(text) is
  'Updates patient and partner care_memberships for the latest care cycle to basic, care, or emotional scope.';
comment on function public.get_partner_action_view(text) is
  'Sanitized live partner projection with membership-backed sharing_scope. Returns no source_text or raw token data.';
