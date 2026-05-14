create table if not exists clinic_updates (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  same_medication boolean,
  added_medication_ids text[] default '{}',
  medication_days int,
  next_visit_at timestamptz,
  trigger_plan text check (trigger_plan in ('today','tomorrow','not_yet','unknown')),
  memo text,
  created_at timestamptz default now()
);

alter table clinic_updates enable row level security;

create policy "patient_own_clinic_updates" on clinic_updates
  for all using (auth.uid() = patient_id);

create policy "partner_read_clinic_updates" on clinic_updates
  for select using (
    exists (
      select 1 from partner_links
      where partner_links.patient_id = clinic_updates.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );
