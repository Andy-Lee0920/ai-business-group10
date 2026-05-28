-- ADR 0015/0016/0017 records + community foundation.
-- Creates the closed-beta couple journal and role-scoped community schema.

create table if not exists public.couple_journal_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_role text not null check (author_role in ('primary', 'partner')),
  body text not null check (length(trim(body)) > 0),
  mood text check (mood is null or mood in ('calm', 'tired', 'worried', 'hopeful', 'unknown')),
  pain_score integer check (pain_score is null or (pain_score between 0 and 10)),
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists couple_journal_entries_couple_created_idx
  on public.couple_journal_entries(couple_id, created_at desc)
  where deleted_at is null;

create or replace function public.enforce_partner_journal_medical_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.author_role = 'partner' then
    new.pain_score := null;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_partner_journal_medical_fields_trigger on public.couple_journal_entries;
create trigger enforce_partner_journal_medical_fields_trigger
  before insert or update on public.couple_journal_entries
  for each row execute function public.enforce_partner_journal_medical_fields();

create table if not exists public.community_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  couple_id uuid not null references public.couples(id) on delete cascade,
  role text not null check (role in ('primary', 'partner')),
  nickname text not null unique check (length(trim(nickname)) between 2 and 24),
  created_at timestamptz not null default now(),
  last_changed_at timestamptz not null default now(),
  unique (couple_id, role)
);

create index if not exists community_identities_user_idx
  on public.community_identities(user_id)
  where user_id is not null;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_identity_id uuid not null references public.community_identities(id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  mood text,
  sub_category text not null check (sub_category in ('pain', 'worry', 'today', 'tip')),
  audience text not null check (audience in ('primary_feed', 'partner_feed')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  is_official boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_posts_feed_idx
  on public.community_posts(audience, moderation_status, created_at desc)
  where deleted_at is null;

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  parent_comment_id uuid references public.community_comments(id) on delete cascade,
  community_identity_id uuid not null references public.community_identities(id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments(post_id, moderation_status, created_at)
  where deleted_at is null;

create table if not exists public.community_post_empathies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  actor_couple_id uuid not null references public.couples(id) on delete cascade,
  actor_role text not null check (actor_role in ('primary', 'partner')),
  created_at timestamptz not null default now(),
  unique (post_id, actor_couple_id, actor_role)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_identity_id uuid not null references public.community_identities(id) on delete restrict,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text not null check (reason in ('medical_advice', 'privacy', 'harassment', 'spam', 'other')),
  resolved_status text not null default 'open' check (resolved_status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (reporter_identity_id, target_type, target_id)
);

create table if not exists public.moderation_filter_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null check (rule_type in ('keyword', 'regex')),
  pattern text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.couple_journal_entries enable row level security;
alter table public.community_identities enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_empathies enable row level security;
alter table public.community_reports enable row level security;
alter table public.moderation_filter_rules enable row level security;

create or replace function public.current_user_community_audiences()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select case cm.role
    when 'primary' then 'primary_feed'
    when 'partner' then 'partner_feed'
  end
  from public.couple_members cm
  where cm.user_id = auth.uid()
$$;

create or replace function public.current_user_community_identity_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ci.id
  from public.community_identities ci
  where ci.couple_id in (select public.current_user_couple_ids())
    and (ci.user_id = auth.uid() or ci.user_id is null)
$$;

create policy "couple_journal_entries_select_own_couple" on public.couple_journal_entries
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()) and deleted_at is null);

create policy "couple_journal_entries_insert_own_couple" on public.couple_journal_entries
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

create policy "couple_journal_entries_update_own_author" on public.couple_journal_entries
  for update to authenticated
  using (author_id = auth.uid() and couple_id in (select public.current_user_couple_ids()))
  with check (author_id = auth.uid() and couple_id in (select public.current_user_couple_ids()));

create policy "community_identities_select_own_couple" on public.community_identities
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

create policy "community_identities_insert_own_couple" on public.community_identities
  for insert to authenticated
  with check (user_id = auth.uid() and couple_id in (select public.current_user_couple_ids()));

create policy "community_identities_update_own_identity" on public.community_identities
  for update to authenticated
  using (user_id = auth.uid() and couple_id in (select public.current_user_couple_ids()))
  with check (user_id = auth.uid() and couple_id in (select public.current_user_couple_ids()));

create policy "community_posts_select_approved_audience" on public.community_posts
  for select to authenticated
  using (
    deleted_at is null
    and moderation_status = 'approved'
    and audience in (select public.current_user_community_audiences())
  );

create policy "community_posts_select_own_identity" on public.community_posts
  for select to authenticated
  using (community_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_posts_insert_own_identity" on public.community_posts
  for insert to authenticated
  with check (community_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_posts_soft_delete_own_identity" on public.community_posts
  for update to authenticated
  using (community_identity_id in (select public.current_user_community_identity_ids()))
  with check (community_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_comments_select_approved_audience" on public.community_comments
  for select to authenticated
  using (
    deleted_at is null
    and moderation_status = 'approved'
    and exists (
      select 1
      from public.community_posts
      where community_posts.id = community_comments.post_id
        and community_posts.deleted_at is null
        and community_posts.moderation_status = 'approved'
        and community_posts.audience in (select public.current_user_community_audiences())
    )
  );

create policy "community_comments_select_own_identity" on public.community_comments
  for select to authenticated
  using (community_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_comments_insert_own_identity" on public.community_comments
  for insert to authenticated
  with check (community_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_comments_soft_delete_own_identity" on public.community_comments
  for update to authenticated
  using (community_identity_id in (select public.current_user_community_identity_ids()))
  with check (community_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_post_empathies_select_audience" on public.community_post_empathies
  for select to authenticated
  using (
    exists (
      select 1
      from public.community_posts
      where community_posts.id = community_post_empathies.post_id
        and community_posts.moderation_status = 'approved'
        and community_posts.audience in (select public.current_user_community_audiences())
    )
  );

create policy "community_post_empathies_insert_own_actor" on public.community_post_empathies
  for insert to authenticated
  with check (
    actor_couple_id in (select public.current_user_couple_ids())
    and exists (
      select 1 from public.couple_members cm
      where cm.couple_id = actor_couple_id
        and cm.user_id = auth.uid()
        and cm.role = actor_role
    )
  );

create policy "community_post_empathies_delete_own_actor" on public.community_post_empathies
  for delete to authenticated
  using (
    actor_couple_id in (select public.current_user_couple_ids())
    and exists (
      select 1 from public.couple_members cm
      where cm.couple_id = actor_couple_id
        and cm.user_id = auth.uid()
        and cm.role = actor_role
    )
  );

create policy "community_reports_insert_own_identity" on public.community_reports
  for insert to authenticated
  with check (reporter_identity_id in (select public.current_user_community_identity_ids()));

create policy "community_reports_select_own_identity" on public.community_reports
  for select to authenticated
  using (reporter_identity_id in (select public.current_user_community_identity_ids()));

grant select, insert, update on public.couple_journal_entries to authenticated;
grant select, insert, update on public.community_identities to authenticated;
grant select, insert, update on public.community_posts to authenticated;
grant select, insert, update on public.community_comments to authenticated;
grant select, insert, delete on public.community_post_empathies to authenticated;
grant select, insert on public.community_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'couple-journal-photos',
  'couple-journal-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "couple_journal_photos_insert_own_couple" on storage.objects;
create policy "couple_journal_photos_insert_own_couple" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'couple-journal-photos'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and (storage.foldername(name))[1]::uuid in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "couple_journal_photos_read_own_couple" on storage.objects;
create policy "couple_journal_photos_read_own_couple" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'couple-journal-photos'
    and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and (storage.foldername(name))[1]::uuid in (select public.current_user_couple_ids())
  );

comment on table public.couple_journal_entries is
  'Private couple-scoped journal entries. Partner-authored entries cannot persist medical self-report fields such as pain_score.';
comment on table public.community_posts is
  'Role-scoped closed-beta community posts. Non-author reads require approved moderation status and matching audience.';
comment on table public.moderation_filter_rules is
  'Service-role managed deterministic moderation rules; authenticated users receive no direct grants.';
