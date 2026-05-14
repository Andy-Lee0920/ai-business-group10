create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','partner')),
  display_name text,
  linked_patient_id uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "own_profile" on user_profiles
  for all using (auth.uid() = id);

-- partner reads own profile (which links them to patient)
create policy "read_linked_profile" on user_profiles
  for select using (
    auth.uid() = id or
    auth.uid() = linked_patient_id
  );
