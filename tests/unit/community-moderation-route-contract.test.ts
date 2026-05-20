import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = {
  posts: 'app/api/community/posts/route.ts',
  reports: 'app/api/community/reports/route.ts',
  adminQueue: 'app/api/admin/moderation/queue/route.ts',
  adminAction: 'app/api/admin/moderation/[target]/route.ts',
};

describe('community moderation route contract', () => {
  it('adds community post routes with deterministic moderation and pending-by-default inserts', () => {
    expect(existsSync(files.posts)).toBe(true);
    const source = readFileSync(files.posts, 'utf8');

    expect(source).toContain('runDeterministicModerationFilter');
    expect(source).toContain("from('moderation_filter_rules')");
    expect(source).toContain("moderation_status: 'pending'");
    expect(source).toContain("from('community_posts')");
    expect(source).toContain(".eq('moderation_status', 'approved')");
  });

  it('adds report route safeguards for self-report and duplicate-report rejection', () => {
    expect(existsSync(files.reports)).toBe(true);
    const source = readFileSync(files.reports, 'utf8');

    expect(source).toContain('self_report_not_allowed');
    expect(source).toContain('duplicate_report');
    expect(source).toContain("from('community_reports')");
    expect(source).toContain("target_type: targetType");
  });

  it('adds admin moderation queue and approve/reject endpoints behind admin gate and service-role audit', () => {
    for (const file of [files.adminQueue, files.adminAction]) expect(existsSync(file)).toBe(true);
    const queue = readFileSync(files.adminQueue, 'utf8');
    const action = readFileSync(files.adminAction, 'utf8');

    expect(queue).toContain('requireAdminUser');
    expect(queue).toContain('createAuditedSupabaseServiceRoleClient');
    expect(queue).toContain("moderation_status', 'pending'");
    expect(action).toContain('requireAdminUser');
    expect(action).toContain('createAuditedSupabaseServiceRoleClient');
    expect(action).toContain("moderation_status: nextStatus");
    expect(action).toContain("action === 'approve'");
    expect(action).toContain("action === 'reject'");
  });
});
