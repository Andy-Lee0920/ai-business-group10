-- #97 production verification blocker fix.
-- `init_couple_for_user()` used OUT column names that can collide with column
-- references inside PL/pgSQL statements such as `on conflict (couple_id)`.
-- Use explicit variable names and the primary-key constraint target so the
-- authenticated input loop can bootstrap a couple shell on real Supabase.

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
    on conflict on constraint couple_states_pkey do nothing;
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
    on conflict on constraint couple_states_pkey do nothing;
  end if;

  return query
  select v_couple_id, v_primary_member_id, v_partner_member_id, cs.privacy_gate_accepted_at
  from public.couple_states cs
  where cs.couple_id = v_couple_id;
end;
$$;
