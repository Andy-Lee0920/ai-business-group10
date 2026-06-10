-- Care Agent concern-triage storage.
-- Stores tag-only signals and user-confirmed clinic questions without LLM text.

create table if not exists public.concern_signals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  intent text not null check (
    intent in (
      'injection_timing_anxiety',
      'dose_change_doubt',
      'clinic_question',
      'partner_sharing_hesitation',
      'reminder_preference',
      'care_navigation'
    )
  ),
  related_card_id uuid references public.care_action_cards(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists concern_signals_couple_created_idx
  on public.concern_signals(couple_id, created_at desc);

create table if not exists public.clinic_questions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  question_text text not null check (length(trim(question_text)) > 0),
  related_card_id uuid references public.care_action_cards(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'asked', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinic_questions_couple_status_idx
  on public.clinic_questions(couple_id, status, created_at desc);

create table if not exists public.card_reminder_preferences (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  card_id uuid not null references public.care_action_cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_strength text not null check (reminder_strength in ('strong', 'quiet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, card_id, user_id)
);

alter table public.concern_signals enable row level security;
alter table public.clinic_questions enable row level security;
alter table public.card_reminder_preferences enable row level security;

create policy "concern_signals_primary_private_select" on public.concern_signals
  for select to authenticated
  using (
    couple_id in (select public.current_user_couple_ids())
    and exists (
      select 1
      from public.couple_members cm
      where cm.couple_id = concern_signals.couple_id
        and cm.user_id = auth.uid()
        and cm.role = 'primary'
    )
  );

create policy "concern_signals_primary_private_insert" on public.concern_signals
  for insert to authenticated
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
    and exists (
      select 1
      from public.couple_members cm
      where cm.couple_id = concern_signals.couple_id
        and cm.user_id = auth.uid()
        and cm.role = 'primary'
    )
  );

create policy "clinic_questions_primary_private_all" on public.clinic_questions
  for all to authenticated
  using (
    couple_id in (select public.current_user_couple_ids())
    and exists (
      select 1
      from public.couple_members cm
      where cm.couple_id = clinic_questions.couple_id
        and cm.user_id = auth.uid()
        and cm.role = 'primary'
    )
  )
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
    and exists (
      select 1
      from public.couple_members cm
      where cm.couple_id = clinic_questions.couple_id
        and cm.user_id = auth.uid()
        and cm.role = 'primary'
    )
  );

create policy "card_reminder_preferences_own_all" on public.card_reminder_preferences
  for all to authenticated
  using (
    user_id = auth.uid()
    and couple_id in (select public.current_user_couple_ids())
  )
  with check (
    user_id = auth.uid()
    and couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

grant select, insert on public.concern_signals to authenticated;
grant select, insert, update, delete on public.clinic_questions to authenticated;
grant select, insert, update, delete on public.card_reminder_preferences to authenticated;

comment on table public.concern_signals is
  'Primary-private Care Agent intent tags only. No free-form user or model body is stored.';
comment on table public.clinic_questions is
  'User-confirmed questions to bring to a clinic visit. Stores the question and status only; clinic answers are not stored.';
comment on table public.card_reminder_preferences is
  'User notification preference for a confirmed care card. This is not a medical urgency or safety-level signal.';
