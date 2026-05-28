-- ADR 0019/0020: gate couple journal writes behind approved partner link
-- and extend community posts from role-only audience enum to dual-scope feed.

alter table public.community_posts
  add column if not exists audience_scope text,
  add column if not exists audience_role text;

update public.community_posts
set audience_scope = case
    when audience = 'primary_feed' then 'same_role'
    when audience = 'partner_feed' then 'same_role'
    else coalesce(audience_scope, 'same_role')
  end,
  audience_role = case
    when audience = 'primary_feed' then 'primary'
    when audience = 'partner_feed' then 'partner'
    else audience_role
  end
where audience_scope is null or audience_role is null;

alter table public.community_posts
  alter column audience_scope set default 'everyone',
  alter column audience_scope set not null;

alter table public.community_posts
  drop constraint if exists community_posts_audience_scope_check,
  add constraint community_posts_audience_scope_check
    check (audience_scope in ('everyone','same_role'));

alter table public.community_posts
  drop constraint if exists community_posts_audience_role_check,
  add constraint community_posts_audience_role_check
    check (audience_role is null or audience_role in ('primary','partner'));

alter table public.community_posts
  drop constraint if exists community_posts_audience_scope_role_integrity,
  add constraint community_posts_audience_scope_role_integrity
    check (
      (audience_scope = 'everyone' and audience_role is null)
      or (audience_scope = 'same_role' and audience_role is not null)
    );

create index if not exists community_posts_scope_feed_idx
  on public.community_posts(audience_scope, audience_role, moderation_status, created_at desc)
  where deleted_at is null;

create or replace function public.current_user_community_roles()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select cm.role
  from public.couple_members cm
  where cm.user_id = auth.uid()
    and cm.role in ('primary','partner')
$$;

create or replace function public.can_read_community_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_posts p
    where p.id = p_post_id
      and p.deleted_at is null
      and (
        p.community_identity_id in (select public.current_user_community_identity_ids())
        or (
          p.moderation_status = 'approved'
          and (
            p.audience_scope = 'everyone'
            or (p.audience_scope = 'same_role' and p.audience_role in (select public.current_user_community_roles()))
          )
        )
      )
  )
$$;

create or replace function public.current_user_has_approved_partner_link_for_couple(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_links pl
    join public.couple_members primary_member
      on primary_member.user_id = pl.patient_id
     and primary_member.couple_id = p_couple_id
     and primary_member.role = 'primary'
    where pl.status = 'approved'
  )
$$;

drop policy if exists "couple_journal_entries_insert_own_couple" on public.couple_journal_entries;
drop policy if exists "couple_journal_entries_insert_partner_linked" on public.couple_journal_entries;
create policy "couple_journal_entries_insert_partner_linked" on public.couple_journal_entries
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
    and public.current_user_has_approved_partner_link_for_couple(couple_id)
  );

drop policy if exists "community_posts_select_approved_audience" on public.community_posts;
drop policy if exists "community_posts_select_approved_dual_scope" on public.community_posts;
create policy "community_posts_select_approved_dual_scope" on public.community_posts
  for select to authenticated
  using (public.can_read_community_post(id));

drop policy if exists "community_posts_insert_own_identity" on public.community_posts;
create policy "community_posts_insert_own_identity" on public.community_posts
  for insert to authenticated
  with check (
    community_identity_id in (select public.current_user_community_identity_ids())
    and (
      (audience_scope = 'everyone' and audience_role is null)
      or (audience_scope = 'same_role' and audience_role in (select public.current_user_community_roles()))
    )
  );

drop policy if exists "community_posts_soft_delete_own_identity" on public.community_posts;
create policy "community_posts_soft_delete_own_identity" on public.community_posts
  for update to authenticated
  using (community_identity_id in (select public.current_user_community_identity_ids()))
  with check (community_identity_id in (select public.current_user_community_identity_ids()));

drop policy if exists "community_comments_select_approved_audience" on public.community_comments;
drop policy if exists "community_comments_select_visible_post" on public.community_comments;
create policy "community_comments_select_visible_post" on public.community_comments
  for select to authenticated
  using (
    deleted_at is null
    and public.can_read_community_post(post_id)
    and (moderation_status = 'approved' or community_identity_id in (select public.current_user_community_identity_ids()))
  );

drop policy if exists "community_comments_insert_own_identity" on public.community_comments;
drop policy if exists "community_comments_insert_visible_post" on public.community_comments;
create policy "community_comments_insert_visible_post" on public.community_comments
  for insert to authenticated
  with check (
    community_identity_id in (select public.current_user_community_identity_ids())
    and public.can_read_community_post(post_id)
  );

drop policy if exists "community_post_empathies_select_audience" on public.community_post_empathies;
drop policy if exists "community_post_empathies_select_visible_post" on public.community_post_empathies;
create policy "community_post_empathies_select_visible_post" on public.community_post_empathies
  for select to authenticated
  using (public.can_read_community_post(post_id));

drop policy if exists "community_post_empathies_insert_own_actor" on public.community_post_empathies;
drop policy if exists "community_post_empathies_insert_visible_post" on public.community_post_empathies;
create policy "community_post_empathies_insert_visible_post" on public.community_post_empathies
  for insert to authenticated
  with check (
    actor_couple_id in (select public.current_user_couple_ids())
    and exists (
      select 1 from public.couple_members cm
      where cm.couple_id = actor_couple_id
        and cm.user_id = auth.uid()
        and cm.role = actor_role
    )
    and public.can_read_community_post(post_id)
  );

drop policy if exists "community_post_empathies_delete_own_actor" on public.community_post_empathies;
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

comment on column public.community_posts.audience_scope is
  'ADR 0020 audience scope: everyone is visible to all authenticated users after approval; same_role is role-matched.';
comment on column public.community_posts.audience_role is
  'Server-filled actor role for same_role posts. Null for everyone posts.';
comment on function public.current_user_has_approved_partner_link_for_couple(uuid) is
  'ADR 0019 journal write gate: true when the couple primary has an approved partner link.';
