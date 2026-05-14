-- Prescription Capture: attach user-confirmed medication cards to prescription photos.
-- Photos are evidence/source material only; the app does not OCR or infer dose automatically.

alter table public.care_action_cards
  add column if not exists prescription_photo_url text,
  add column if not exists prescription_capture_status text check (
    prescription_capture_status is null or prescription_capture_status in ('photo_attached', 'manual_fallback', 'photo_failed')
  ),
  add column if not exists administered_by text check (
    administered_by is null or administered_by in ('self', 'partner', 'clinic')
  );

create index if not exists care_action_cards_prescription_photo_idx
  on public.care_action_cards(couple_id, prescription_capture_status, created_at desc)
  where prescription_photo_url is not null;

comment on column public.care_action_cards.prescription_photo_url is
  'User-uploaded prescription photo URL. Used as source evidence, never as automatic dosage authority.';
comment on column public.care_action_cards.prescription_capture_status is
  'Whether prescription capture used a photo, manual fallback, or failed photo upload.';
comment on column public.care_action_cards.administered_by is
  'Planned administration owner for medication/injection cards: self, partner, or clinic. Actual injection confirmation remains in injection_logs.';
comment on table public.injection_logs is
  'Trust ledger for injection completion: partner assistance can be recorded, but patient confirmation remains distinct.';
