-- Partner active assist records live on canonical care_action_cards.
-- injection_logs remains a legacy/deprecated path for earlier injection-only assistance.

alter table public.care_action_cards
  add column if not exists partner_assist_at timestamptz;

create index if not exists care_action_cards_partner_assist_idx
  on public.care_action_cards(couple_id, partner_visible, partner_assist_at)
  where partner_visible = true;

create or replace function public.record_partner_assist(
  p_token_hash text,
  p_card_id uuid,
  p_actual_time timestamptz default now()
)
returns table(card_id uuid, partner_assist_at timestamptz)
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
  where c.id = p_card_id
    and c.couple_id = v_couple_id
    and c.partner_visible = true
    and c.status <> 'completed'
  returning c.id, c.partner_assist_at into card_id, partner_assist_at;

  if card_id is null then
    raise exception 'partner card not found' using errcode = 'P0002';
  end if;

  return next;
end;
$$;

revoke all on function public.record_partner_assist(text, uuid, timestamptz) from public;
grant execute on function public.record_partner_assist(text, uuid, timestamptz) to anon, authenticated;
