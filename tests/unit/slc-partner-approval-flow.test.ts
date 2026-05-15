import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('SLC partner approval flow', () => {
  it('keeps requested partner link approval out of the home surface', () => {
    const homePage = read('app/(authed)/home/page.tsx');
    const todayScreen = read('src/features/today/today-screen.tsx');

    expect(homePage).not.toContain(".from('partner_links')");
    expect(homePage).not.toContain(".eq('status', 'requested')");
    expect(homePage).not.toContain('pendingPartnerRequest');
    expect(todayScreen).not.toContain('pendingPartnerRequest');
    expect(todayScreen).not.toContain('data-testid="pending-partner-request-card"');
    expect(todayScreen).not.toContain('파트너 연결 요청이 있어요');
  });

  it('hydrates partner display names before rendering approval surfaces', () => {
    const settingsPage = read('app/(authed)/settings/page.tsx');
    const moreScreen = read('src/features/more/more-screen.tsx');
    const identityMigration = read('supabase/migrations/202605140001_slc_partner_profile_identity.sql');

    expect(settingsPage).toContain('partner_profile:user_profiles!partner_id(display_name)');
    expect(settingsPage).toContain('partner_profile');
    expect(moreScreen).toContain('partnerDisplayName');
    expect(moreScreen).toContain("link.partner_profile?.display_name?.trim() || '파트너'");
    expect(identityMigration).toContain('partner_links_partner_profile_fkey');
    expect(identityMigration).toContain('patient_read_linked_partner_profiles');
  });

  it('allows approved partner access to be revoked without adding an unsupported status', () => {
    const route = read('app/api/partner/approve/route.ts');
    const moreScreen = read('src/features/more/more-screen.tsx');
    const migration = read('supabase/migrations/202605130002_slc_partner_links.sql');

    expect(route).toContain("'revoke'");
    expect(route).toContain("status: 'pending'");
    expect(route).toContain('partner_id: null');
    expect(route).toContain('requested_at: null');
    expect(route).toContain('approved_at: null');
    expect(moreScreen).toContain('연결 해제');
    expect(migration).toContain('approved_at timestamptz');
    expect(migration).toContain("check (status in ('pending','requested','approved','rejected'))");
  });

  it('tells partners to refresh because the server component rechecks approval on load', () => {
    const partnerPage = read('app/(authed)/partner/page.tsx');

    expect(partnerPage).toContain("link.status !== 'approved'");
    expect(partnerPage).toContain('새로고침해서 확인해 주세요');
  });
});
