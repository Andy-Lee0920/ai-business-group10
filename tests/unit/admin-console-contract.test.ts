import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = {
  moderationPage: 'app/admin/moderation/page.tsx',
  auditPage: 'app/admin/audit/page.tsx',
  seedPage: 'app/admin/seed/page.tsx',
  auditApi: 'app/api/admin/audit/route.ts',
  seedApi: 'app/api/admin/seed/route.ts',
};

describe('closed beta admin console contract', () => {
  it('adds admin pages for moderation queue, audit log, and official seed posts', () => {
    for (const file of [files.moderationPage, files.auditPage, files.seedPage]) expect(existsSync(file)).toBe(true);
    const moderationPage = readFileSync(files.moderationPage, 'utf8');
    const auditPage = readFileSync(files.auditPage, 'utf8');
    const seedPage = readFileSync(files.seedPage, 'utf8');

    expect(moderationPage).toContain('getAdminUser');
    expect(moderationPage).toContain('AdminModerationPanel');
    expect(auditPage).toContain('service_role_audit_logs');
    expect(seedPage).toContain('AdminSeedForm');
  });

  it('adds admin APIs behind allowlist gate and audited service-role access', () => {
    for (const file of [files.auditApi, files.seedApi]) expect(existsSync(file)).toBe(true);
    const auditApi = readFileSync(files.auditApi, 'utf8');
    const seedApi = readFileSync(files.seedApi, 'utf8');

    expect(auditApi).toContain('requireAdminUser');
    expect(auditApi).toContain('createAuditedSupabaseServiceRoleClient');
    expect(auditApi).toContain("from('service_role_audit_logs')");
    expect(seedApi).toContain('requireAdminUser');
    expect(seedApi).toContain('is_official: true');
    expect(seedApi).toContain("moderation_status: 'approved'");
    expect(seedApi).toContain('운영팀 안내');
  });
});
