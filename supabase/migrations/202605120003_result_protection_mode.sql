-- Result Protection Mode metadata for a completed/negative cycle.
-- The state machine owns phase transitions; these columns store protection timing only.

alter table public.treatment_cycles
  add column if not exists cycle_outcome text check (cycle_outcome is null or cycle_outcome in ('positive', 'negative', 'cancelled', 'paused')),
  add column if not exists result_protection_started_at timestamptz,
  add column if not exists result_review_opened_at timestamptz,
  add column if not exists quiet_until timestamptz;

create index if not exists treatment_cycles_result_protection_idx
  on public.treatment_cycles(couple_id, result_protection_started_at desc)
  where result_protection_started_at is not null;

comment on column public.treatment_cycles.cycle_outcome is
  'User/clinic-confirmed outcome for cycle closure. Negative outcome enters Result Protection before planning.';
comment on column public.treatment_cycles.result_protection_started_at is
  'Start of always-free post-negative-result protected surface.';
comment on column public.treatment_cycles.result_review_opened_at is
  'Null means the cycle review remains hidden until the user explicitly opens it.';
comment on column public.treatment_cycles.quiet_until is
  'Suppress non-medication nudges during Result Protection; routine medication reminders may continue.';
