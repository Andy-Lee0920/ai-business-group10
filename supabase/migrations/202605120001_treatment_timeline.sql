-- Post-SLC TreatmentTimeline schema.
-- Confirmed milestones are phase hints; executable tasks remain in care_action_cards.

create table if not exists public.treatment_cycles (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  cycle_number integer not null check (cycle_number > 0),
  protocol text check (protocol is null or protocol in ('long_agonist', 'antagonist', 'mini_ivf')),
  started_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, cycle_number)
);

create table if not exists public.treatment_milestones (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.treatment_cycles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  milestone text not null check (
    milestone in (
      'initial_visit',
      'stimulation_start',
      'trigger_shot',
      'egg_retrieval',
      'embryo_transfer',
      'result_day'
    )
  ),
  confirmed_at date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatment_cycles_couple_started_idx
  on public.treatment_cycles(couple_id, started_at desc);

create index if not exists treatment_milestones_couple_date_idx
  on public.treatment_milestones(couple_id, confirmed_at desc, milestone);

create index if not exists treatment_milestones_cycle_idx
  on public.treatment_milestones(cycle_id, confirmed_at desc);

create or replace function public.ensure_treatment_milestone_couple_matches_cycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.treatment_cycles c
    where c.id = new.cycle_id
      and c.couple_id = new.couple_id
  ) then
    raise exception 'Treatment milestone couple_id must match treatment cycle.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists treatment_milestones_couple_matches_cycle on public.treatment_milestones;
create trigger treatment_milestones_couple_matches_cycle
  before insert or update on public.treatment_milestones
  for each row execute function public.ensure_treatment_milestone_couple_matches_cycle();

alter table public.treatment_cycles enable row level security;
alter table public.treatment_milestones enable row level security;

create policy "treatment_cycles_select_own" on public.treatment_cycles
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "treatment_cycles_insert_own_after_privacy" on public.treatment_cycles
  for insert to authenticated
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "treatment_cycles_update_own" on public.treatment_cycles
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

create policy "treatment_milestones_select_own" on public.treatment_milestones
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "treatment_milestones_insert_own_after_privacy" on public.treatment_milestones
  for insert to authenticated
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "treatment_milestones_update_own" on public.treatment_milestones
  for update to authenticated
  using (couple_id in (select public.current_user_couple_ids()))
  with check (couple_id in (select public.current_user_couple_ids()));

grant select, insert, update on public.treatment_cycles to authenticated;
grant select, insert, update on public.treatment_milestones to authenticated;

comment on table public.treatment_cycles is
  'Post-SLC IVF cycle container. Does not store medical recommendations.';
comment on table public.treatment_milestones is
  'User-confirmed treatment milestones used as phase hints for computeCareDayV2.';
comment on column public.treatment_milestones.confirmed_at is
  'User-confirmed date; estimated/template dates must not drive active care surfaces.';
