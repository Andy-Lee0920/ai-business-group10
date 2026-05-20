import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const matrix = readFileSync('docs/03-engineering/schema-rls-matrix.md', 'utf8');

describe('records/community RLS matrix coverage', () => {
  it('documents every journal/community/audit storage table and bucket', () => {
    for (const name of [
      'couple_journal_entries',
      'community_identities',
      'community_posts',
      'community_comments',
      'community_post_empathies',
      'community_reports',
      'moderation_filter_rules',
      'couple-journal-photos',
      'service_role_audit_logs',
    ]) {
      expect(matrix).toContain(`\`${name}\``);
    }
  });

  it('records actor, server exception, and test evidence expectations for the new surfaces', () => {
    expect(matrix).toContain('partner-authored journal entries force `pain_score NULL`');
    expect(matrix).toContain('ADR 0020 scope (`everyone` or role-matched `same_role`)');
    expect(matrix).toContain('service-role only; no authenticated direct grants');
    expect(matrix).toContain('records-community-schema-rls.test.ts');
    expect(matrix).toContain('service-role audit contract');
  });
});
