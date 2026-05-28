import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const api = 'app/api/partner/[token]/community/route.ts';
const client = 'app/partner/[token]/PartnerCommunityClient.tsx';
const page = 'app/partner/[token]/page.tsx';

describe('partner community feed contract', () => {
  it('exposes only approved partner-readable community posts through token validation', () => {
    expect(existsSync(api)).toBe(true);
    const source = readFileSync(api, 'utf8');

    expect(source).toContain('hashPartnerShareToken');
    expect(source).toContain("rpc('is_partner_share_link_usable'");
    expect(source).toContain("from('community_posts')");
    expect(source).toContain("audience_scope.eq.everyone");
    expect(source).toContain("audience_role.eq.partner");
    expect(source).toContain(".eq('moderation_status', 'approved')");
    expect(source).toContain('createAuditedSupabaseServiceRoleClient');
  });

  it('mounts the partner community client from /partner/[token]', () => {
    expect(existsSync(client)).toBe(true);
    const clientSource = readFileSync(client, 'utf8');
    const pageSource = readFileSync(page, 'utf8');

    expect(clientSource).toContain('오늘의 파트너 커뮤니티');
    expect(clientSource).toContain(`/api/partner/`);
    expect(pageSource).toContain('PartnerCommunityClient');
  });
});
