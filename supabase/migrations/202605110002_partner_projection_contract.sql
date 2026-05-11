-- #103 v1.0 one-way shared-care projection contract.
-- Partner view remains read-only and token-hash based. This only widens the
-- sanitized projection with safe sync markers; it does not add partner writeback.

drop function if exists public.get_partner_action_view(text);

create or replace function public.get_partner_action_view(p_token_hash text)
returns table (
  id uuid,
  title text,
  scheduled_at timestamptz,
  card_type text,
  description text,
  display_state text,
  revision integer
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
    c.revision
  from public.partner_share_links psl
  join public.care_action_cards c on c.couple_id = psl.couple_id
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
  'Sanitized one-way live partner projection. Returns safe card metadata, display_state, and revision only; raw source_text and private fields remain excluded.';
