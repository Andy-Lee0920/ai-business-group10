-- Remote repair for Session A onboarding changes.
-- Earlier Session A edited already-applied SLC migrations; production needs a new forward migration.

alter table public.user_consents
  add column if not exists privacy_boundary_accepted_at timestamptz,
  add column if not exists input_assist_disclaimer_accepted_at timestamptz,
  add column if not exists consent_source text not null default 'onboarding';

alter table public.user_consents
  drop constraint if exists user_consents_consent_source_check;

alter table public.user_consents
  add constraint user_consents_consent_source_check
  check (consent_source in ('onboarding','demo','legacy'));

alter table public.schedule_items
  drop constraint if exists schedule_items_source_check;

alter table public.schedule_items
  add constraint schedule_items_source_check
  check (source in ('seed','manual','clinic_update','onboarding_interview'));
