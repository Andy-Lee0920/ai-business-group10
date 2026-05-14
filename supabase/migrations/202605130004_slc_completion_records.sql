create table if not exists completion_records (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid not null references schedule_items(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  injection_site text check (injection_site in ('upper_left','upper_right','lower_left','lower_right')),
  edited_at timestamptz,
  created_at timestamptz default now()
);

alter table completion_records enable row level security;

drop policy if exists "patient_own_completions" on completion_records;
create policy "patient_own_completions" on completion_records
  for all using (auth.uid() = patient_id);

drop policy if exists "partner_read_completions" on completion_records;
create policy "partner_read_completions" on completion_records
  for select using (
    exists (
      select 1 from partner_links
      where partner_links.patient_id = completion_records.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );
