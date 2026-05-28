-- #25 CareActionCard model.
-- Display priority is computed in app code, not persisted as medical judgment.

create table if not exists public.care_action_cards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  source_input_id uuid,
  split_candidate_id uuid,
  assignee_role text not null check (assignee_role in ('primary_user', 'partner', 'both')),
  card_type text not null check (
    card_type in (
      'injection',
      'medication',
      'clinic_visit',
      'clinic_confirmation',
      'partner_support',
      'record',
      'general_action'
    )
  ),
  title text not null,
  description text,
  source_text text not null,
  scheduled_at timestamptz,
  care_date date,
  status text not null default 'confirmed' check (
    status in ('confirmed', 'completed', 'dismissed', 'revoked', 'superseded', 'archived')
  ),
  confirmation_required boolean not null default true,
  user_marked_important boolean not null default false,
  partner_visible boolean not null default false,
  medical_boundary_label text not null default 'user_confirmed_instruction',
  revision integer not null default 1 check (revision > 0),
  superseded_by uuid references public.care_action_cards(id),
  revoked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (care_date is not null or scheduled_at is not null or status <> 'confirmed')
);

create index if not exists care_action_cards_couple_date_idx
  on public.care_action_cards(couple_id, care_date, scheduled_at);

create index if not exists care_action_cards_couple_status_idx
  on public.care_action_cards(couple_id, status, card_type);

create index if not exists care_action_cards_partner_visible_idx
  on public.care_action_cards(couple_id, partner_visible)
  where partner_visible = true;

alter table public.care_action_cards enable row level security;

create policy "care_action_cards_select_own" on public.care_action_cards
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "care_action_cards_insert_own_after_privacy" on public.care_action_cards
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "care_action_cards_update_own" on public.care_action_cards
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

grant select, insert, update on public.care_action_cards to authenticated;

comment on column public.care_action_cards.source_input_id is
  'UUID of visit_inputs.id; FK added with the #24 capture migration once that table exists.';
comment on column public.care_action_cards.split_candidate_id is
  'UUID of split_candidates.id; FK added with the #24 capture migration once that table exists.';
comment on table public.care_action_cards is
  'Confirmed user instructions. UI display safety is computed, not stored.';
