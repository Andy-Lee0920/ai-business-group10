import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = 'supabase/migrations';
const migrationName = '202605200001_records_community_foundation.sql';
const dualScopeMigrationName = '202605200003_records_dual_scope_and_journal_gate.sql';
const communityPhotoMigrationName = '202605270001_community_post_photos.sql';
const migrationPath = join(migrationsDir, migrationName);
const dualScopeMigrationPath = join(migrationsDir, dualScopeMigrationName);
const communityPhotoMigrationPath = join(migrationsDir, communityPhotoMigrationName);

function migration() {
  return readFileSync(migrationPath, 'utf8');
}

function dualScopeMigration() {
  return readFileSync(dualScopeMigrationPath, 'utf8');
}

function communityPhotoMigration() {
  return readFileSync(communityPhotoMigrationPath, 'utf8');
}

describe('records/community schema and RLS foundation', () => {
  it('adds one forward migration for journal and community entities', () => {
    expect(readdirSync(migrationsDir)).toContain(migrationName);
  });

  it('creates all ADR 0015/0016 records and community tables with RLS enabled', () => {
    const sql = migration();
    for (const table of [
      'couple_journal_entries',
      'community_identities',
      'community_posts',
      'community_comments',
      'community_post_empathies',
      'community_reports',
      'moderation_filter_rules',
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('enforces couple-only journal access and partner-authored medical fields nulling', () => {
    const sql = migration();

    expect(sql).toContain('couple_journal_entries_select_own_couple');
    expect(sql).toContain('couple_id in (select public.current_user_couple_ids())');
    expect(sql).toContain('public.can_create_sensitive_rows(couple_id)');
    expect(sql).toContain('enforce_partner_journal_medical_fields');
    expect(sql).toContain('new.author_role = \'partner\'');
    expect(sql).toContain('new.pain_score := null');
  });

  it('limits community reads by audience and approved moderation status', () => {
    const sql = migration();

    expect(sql).toContain('community_posts_select_approved_audience');
    expect(sql).toContain("moderation_status = 'approved'");
    expect(sql).toContain('public.current_user_community_audiences()');
    expect(sql).toContain('community_comments_select_approved_audience');
    expect(sql).toContain('community_posts.audience in (select public.current_user_community_audiences())');
  });

  it('keeps writes/deletes owned by the author identity and de-dupes empathy/reports', () => {
    const sql = migration();

    expect(sql).toContain('community_posts_insert_own_identity');
    expect(sql).toContain('community_posts_soft_delete_own_identity');
    expect(sql).toContain('community_comments_insert_own_identity');
    expect(sql).toContain('community_comments_soft_delete_own_identity');
    expect(sql).toContain('unique (post_id, actor_couple_id, actor_role)');
    expect(sql).toContain('unique (reporter_identity_id, target_type, target_id)');
  });

  it('creates a private couple-journal-photos bucket with couple-scoped storage policies', () => {
    const sql = migration();

    expect(sql).toContain("'couple-journal-photos'");
    expect(sql).toContain('public = false');
    expect(sql).toContain('couple_journal_photos_insert_own_couple');
    expect(sql).toContain('couple_journal_photos_read_own_couple');
    expect(sql).toContain("bucket_id = 'couple-journal-photos'");
    expect(sql).toContain('(storage.foldername(name))[1]::uuid in (select public.current_user_couple_ids())');
  });

  it('adds dual-scope community audience columns and partner-link gated journal inserts', () => {
    expect(readdirSync(migrationsDir)).toContain(dualScopeMigrationName);
    const sql = dualScopeMigration();

    expect(sql).toContain('audience_scope');
    expect(sql).toContain("audience_scope in ('everyone','same_role')");
    expect(sql).toContain('audience_role');
    expect(sql).toContain("audience = 'primary_feed'");
    expect(sql).toContain("audience_scope = 'same_role'");
    expect(sql).toContain('community_posts_select_approved_dual_scope');
    expect(sql).toContain("audience_scope = 'everyone'");
    expect(sql).toContain('public.current_user_community_roles()');
    expect(sql).toContain('community_comments_insert_visible_post');
    expect(sql).toContain('community_post_empathies_insert_visible_post');
    expect(sql).toContain('current_user_has_approved_partner_link_for_couple');
    expect(sql).toContain('couple_journal_entries_insert_partner_linked');
  });

  it('adds moderated community photo cards without making the bucket public', () => {
    expect(readdirSync(migrationsDir)).toContain(communityPhotoMigrationName);
    const sql = communityPhotoMigration();

    expect(sql).toContain('add column if not exists photo_urls');
    expect(sql).toContain("'community-post-photos'");
    expect(sql).toContain('public = false');
    expect(sql).toContain('community_post_photos_insert_own_user');
    expect(sql).toContain("bucket_id = 'community-post-photos'");
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(sql).toContain('community_post_photos_read_visible_post');
    expect(sql).toContain('public.can_read_community_post(id)');
  });
});
