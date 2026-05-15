create table if not exists public.schedule_candidates (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  image_path text,
  raw_text text,
  status text not null default 'draft' check (status in ('draft','confirmed','rejected')),
  type text not null,
  title text not null,
  scheduled_at timestamptz,
  dose text,
  unit text,
  created_at timestamptz not null default now()
);

alter table public.schedule_candidates enable row level security;

-- patient: full CRUD on own captured schedule candidates
drop policy if exists "patient_own_schedule_candidates" on public.schedule_candidates;
create policy "patient_own_schedule_candidates" on public.schedule_candidates
  for all to authenticated
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

alter table public.schedule_items
  drop constraint if exists schedule_items_source_check;

alter table public.schedule_items
  add constraint schedule_items_source_check
  check (source in ('seed','manual','clinic_update','onboarding_interview','capture'));
