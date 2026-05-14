create table if not exists user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','partner')),
  consent_version text not null default 'slc-v1',
  sensitive_data_accepted_at timestamptz not null,
  medical_disclaimer_accepted_at timestamptz not null,
  partner_sharing_accepted_at timestamptz,
  created_at timestamptz default now()
);

alter table user_consents enable row level security;

create policy "own_consent" on user_consents
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
