-- Private clinic photo storage for authenticated onboarding uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-photos',
  'clinic-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "patients_insert_own_clinic_photos" on storage.objects;
create policy "patients_insert_own_clinic_photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clinic-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "patients_read_own_clinic_photos" on storage.objects;
create policy "patients_read_own_clinic_photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinic-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
