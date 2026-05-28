-- #423 Preserve source offsets for split_candidates.
-- Existing rows remain NULL; new write paths populate offsets when the source text
-- can be mapped to the canonical visit_inputs.raw_text with JavaScript slice semantics.

alter table public.split_candidates
  add column if not exists source_offset_start int null,
  add column if not exists source_offset_end int null;

comment on column public.split_candidates.source_offset_start is
  'Nullable UTF-16 source offset into visit_inputs.raw_text. NULL marks legacy rows or candidates without an exact source span.';

comment on column public.split_candidates.source_offset_end is
  'Nullable exclusive UTF-16 source offset into visit_inputs.raw_text. NULL marks legacy rows or candidates without an exact source span.';

create or replace function public.confirm_capture(
  p_draft_id uuid,
  p_visit_input_id uuid,
  p_items jsonb
)
returns table (created_card_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_created_card_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'auth.uid() required for capture confirmation' using errcode = '28000';
  end if;

  select d.couple_id into v_couple_id
  from public.action_split_drafts d
  where d.id = p_draft_id
    and d.visit_input_id = p_visit_input_id
    and d.couple_id in (select public.current_user_couple_ids())
  limit 1;

  if v_couple_id is null or not public.can_create_sensitive_rows(v_couple_id) then
    raise exception 'Privacy Gate must be accepted before creating sensitive Fevio data.' using errcode = '42501';
  end if;

  insert into public.split_candidates(
    couple_id,
    draft_id,
    visit_input_id,
    source_text,
    source_offset_start,
    source_offset_end,
    assigned_to,
    suggested_card_type,
    confidence,
    order_index
  )
  select
    v_couple_id,
    p_draft_id,
    p_visit_input_id,
    item->>'source_text',
    nullif(item->>'source_offset_start', '')::int,
    nullif(item->>'source_offset_end', '')::int,
    item->>'assigned_to',
    nullif(item->>'suggested_card_type', ''),
    case when coalesce(item->>'confidence', '') = 'needs_confirmation' then 'needs_confirmation' else 'high' end,
    (item->>'order_index')::integer
  from jsonb_array_elements(p_items) item
  where length(trim(item->>'source_text')) > 0;

  insert into public.care_action_cards(
    couple_id,
    created_by,
    source_input_id,
    assignee_role,
    card_type,
    title,
    description,
    source_text,
    scheduled_at,
    care_date,
    status,
    confirmation_required,
    user_marked_important,
    partner_visible
  )
  select
    v_couple_id,
    v_user_id,
    p_visit_input_id,
    case item->>'assigned_to'
      when 'partner_action' then 'partner'
      else 'primary_user'
    end,
    item->>'card_type',
    item->>'source_text',
    nullif(item->>'description', ''),
    item->>'source_text',
    nullif(item->>'scheduled_at', '')::timestamptz,
    nullif(item->>'care_date', '')::date,
    'confirmed',
    item->>'assigned_to' = 'clinic_confirmation' or coalesce(item->>'confidence', '') = 'needs_confirmation',
    coalesce((item->>'user_marked_important')::boolean, false),
    coalesce((item->>'partner_visible')::boolean, false)
  from jsonb_array_elements(p_items) item
  where item->>'assigned_to' <> 'excluded'
    and length(trim(item->>'source_text')) > 0;

  get diagnostics v_created_card_count = row_count;

  update public.action_split_drafts
  set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
  where id = p_draft_id;

  update public.couple_states
  set first_capture_completed_at = coalesce(first_capture_completed_at, now()),
      updated_at = now()
  where couple_id = v_couple_id;

  return query select v_created_card_count;
end;
$$;
