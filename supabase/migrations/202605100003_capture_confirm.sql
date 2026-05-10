-- #24 Capture + manual split + confirm thin slice.

create table if not exists public.visit_inputs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  raw_text text not null check (length(trim(raw_text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.action_split_drafts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  visit_input_id uuid not null references public.visit_inputs(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists public.split_candidates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  draft_id uuid not null references public.action_split_drafts(id) on delete cascade,
  visit_input_id uuid not null references public.visit_inputs(id) on delete cascade,
  source_text text not null check (length(trim(source_text)) > 0),
  assigned_to text not null check (assigned_to in ('my_action', 'partner_action', 'clinic_confirmation', 'excluded')),
  suggested_card_type text check (suggested_card_type in ('injection', 'medication', 'clinic_visit', 'clinic_confirmation', 'partner_support', 'record', 'general_action')),
  confidence text not null default 'high' check (confidence in ('high', 'needs_confirmation')),
  order_index integer not null,
  created_at timestamptz not null default now()
);


alter table public.visit_inputs enable row level security;
alter table public.action_split_drafts enable row level security;
alter table public.split_candidates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'care_action_cards_source_input_fk'
  ) then
    alter table public.care_action_cards
      add constraint care_action_cards_source_input_fk
      foreign key (source_input_id) references public.visit_inputs(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'care_action_cards_split_candidate_fk'
  ) then
    alter table public.care_action_cards
      add constraint care_action_cards_split_candidate_fk
      foreign key (split_candidate_id) references public.split_candidates(id) on delete set null;
  end if;
end;
$$;
alter table public.care_action_cards enable row level security;

create policy "visit_inputs_own_all" on public.visit_inputs
  for all to authenticated
  using (couple_id in (select public.current_user_couple_ids()) and public.can_create_sensitive_rows(couple_id))
  with check (couple_id in (select public.current_user_couple_ids()) and public.can_create_sensitive_rows(couple_id));

create policy "action_split_drafts_own_all" on public.action_split_drafts
  for all to authenticated
  using (couple_id in (select public.current_user_couple_ids()) and public.can_create_sensitive_rows(couple_id))
  with check (couple_id in (select public.current_user_couple_ids()) and public.can_create_sensitive_rows(couple_id));

create policy "split_candidates_own_all" on public.split_candidates
  for all to authenticated
  using (couple_id in (select public.current_user_couple_ids()) and public.can_create_sensitive_rows(couple_id))
  with check (couple_id in (select public.current_user_couple_ids()) and public.can_create_sensitive_rows(couple_id));


grant select, insert on public.visit_inputs to authenticated;
grant select, insert on public.action_split_drafts to authenticated;
grant select, insert on public.split_candidates to authenticated;

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
    item->>'assigned_to',
    nullif(item->>'suggested_card_type', ''),
    'high',
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
    source_text,
    status,
    confirmation_required
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
    item->>'source_text',
    'confirmed',
    item->>'assigned_to' = 'clinic_confirmation'
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

revoke all on function public.confirm_capture(uuid, uuid, jsonb) from public;
grant execute on function public.confirm_capture(uuid, uuid, jsonb) to authenticated;
