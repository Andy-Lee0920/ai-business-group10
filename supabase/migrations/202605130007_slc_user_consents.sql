create table if not exists user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','partner')),
  consent_version text not null default 'slc-v1',
  privacy_boundary_accepted_at timestamptz,
  sensitive_data_accepted_at timestamptz not null,
  medical_disclaimer_accepted_at timestamptz not null,
  input_assist_disclaimer_accepted_at timestamptz,
  partner_sharing_accepted_at timestamptz,
  consent_source text not null default 'onboarding' check (consent_source in ('onboarding','demo','legacy')),
  created_at timestamptz default now()
);

alter table user_consents enable row level security;

drop policy if exists "own_consent" on user_consents;
create policy "own_consent" on user_consents
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
