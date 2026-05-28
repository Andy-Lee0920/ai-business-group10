-- Move the partner action view privacy boundary into the granted RPC contract.
-- The function keeps raw card copy out of direct anon/authenticated RPC output.

drop function if exists public.get_partner_action_view(text);

create function public.get_partner_action_view(p_token_hash text)
returns table (
  safe_id text,
  scheduled_at timestamptz,
  card_type text,
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
    left(encode(digest(c.id::text, 'sha256'), 'hex'), 16) as safe_id,
    c.scheduled_at,
    c.card_type,
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

revoke all on function public.get_partner_action_view(text) from public;
grant execute on function public.get_partner_action_view(text) to anon, authenticated;

comment on function public.get_partner_action_view(text) is
  'Sanitized live partner projection with membership-backed sharing_scope. Returns safe ids, timing, card type, display state, revision, and sharing scope only.';

drop function if exists public.resolve_partner_action_card_id(text, text);

create function public.resolve_partner_action_card_id(
  p_token_hash text,
  p_safe_id text
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.partner_share_links psl
  join public.care_action_cards c on c.couple_id = psl.couple_id
  where psl.token_hash = p_token_hash
    and psl.revoked_at is null
    and psl.expires_at > now()
    and c.partner_visible = true
    and c.status in ('confirmed', 'completed', 'revoked', 'superseded')
    and left(encode(digest(c.id::text, 'sha256'), 'hex'), 16) = p_safe_id
  order by c.scheduled_at nulls last, c.created_at
  limit 1;
$$;

revoke all on function public.resolve_partner_action_card_id(text, text) from public;
grant execute on function public.resolve_partner_action_card_id(text, text) to service_role;

comment on function public.resolve_partner_action_card_id(text, text) is
  'Resolves a partner-safe card id to the canonical card id only inside service-role workflows.';

drop function if exists public.record_partner_assist_by_safe_id(text, text, timestamptz);

create function public.record_partner_assist_by_safe_id(
  p_token_hash text,
  p_safe_id text,
  p_actual_time timestamptz default now()
)
returns table(card_safe_id text, partner_assist_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_partner_assist_at timestamptz := coalesce(p_actual_time, now());
begin
  select psl.couple_id into v_couple_id
  from public.partner_share_links psl
  where psl.token_hash = p_token_hash
    and psl.revoked_at is null
    and psl.expires_at > now()
  limit 1;

  if v_couple_id is null then
    raise exception 'partner link not found' using errcode = '42501';
  end if;

  update public.care_action_cards c
  set partner_assist_at = coalesce(c.partner_assist_at, v_partner_assist_at),
      updated_at = now()
  where c.couple_id = v_couple_id
    and c.partner_visible = true
    and c.status <> 'completed'
    and left(encode(digest(c.id::text, 'sha256'), 'hex'), 16) = p_safe_id
  returning left(encode(digest(c.id::text, 'sha256'), 'hex'), 16), c.partner_assist_at
    into card_safe_id, partner_assist_at;

  if card_safe_id is null then
    raise exception 'partner card not found' using errcode = 'P0002';
  end if;

  return next;
end;
$$;

revoke all on function public.record_partner_assist_by_safe_id(text, text, timestamptz) from public;
grant execute on function public.record_partner_assist_by_safe_id(text, text, timestamptz) to anon, authenticated;

comment on function public.record_partner_assist_by_safe_id(text, text, timestamptz) is
  'Records partner assist through a token-scoped safe card id without exposing canonical card ids.';
