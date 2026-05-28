-- Community shared records now support moderated photo cards.
-- Photos remain in a private bucket; the app issues short-lived signed URLs.

alter table public.community_posts
  add column if not exists photo_urls text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-post-photos',
  'community-post-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_post_photos_insert_own_user" on storage.objects;
create policy "community_post_photos_insert_own_user" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "community_post_photos_read_authenticated" on storage.objects;
drop policy if exists "community_post_photos_read_visible_post" on storage.objects;
create policy "community_post_photos_read_visible_post" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'community-post-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1
        from public.community_posts
        where name = any(photo_urls)
          and public.can_read_community_post(id)
      )
    )
  );

drop policy if exists "community_post_photos_delete_own_user" on storage.objects;
create policy "community_post_photos_delete_own_user" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'community-post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on column public.community_posts.photo_urls is
  'Moderated shared-record photo paths for card-style community posts. Raw clinic documents and visible personal information are prohibited by UI copy and moderation.';
