create table if not exists partner_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id),
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending','requested','approved','rejected')),
  created_at timestamptz default now(),
  requested_at timestamptz,
  approved_at timestamptz
);

alter table partner_links enable row level security;

-- patient: full control
create policy "patient_own_partner_links" on partner_links
  for all using (auth.uid() = patient_id);

-- partner: can read/update their own link
create policy "partner_read_own_link" on partner_links
  for select using (auth.uid() = partner_id);

create policy "partner_update_own_link" on partner_links
  for update using (auth.uid() = partner_id)
  with check (auth.uid() = partner_id);

-- anyone with invite code can insert a request (join)
create policy "public_join_by_invite" on partner_links
  for update using (
    invite_code is not null
    and status = 'pending'
    and partner_id is null
  );
