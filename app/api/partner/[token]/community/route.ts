import { NextResponse } from 'next/server';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { hashPartnerShareToken } from '../../../../../src/services/partner-view';
import type { CommunityPostListItem } from '../../../../../src/types/community.types';

export const dynamic = 'force-dynamic';

type CommunityPostRow = {
  id: string;
  body: string;
  mood: string | null;
  sub_category: CommunityPostListItem['subCategory'];
  audience: CommunityPostListItem['audience'];
  audience_scope: CommunityPostListItem['audienceScope'] | null;
  audience_role: CommunityPostListItem['audienceRole'];
  moderation_status: CommunityPostListItem['moderationStatus'];
  is_official: boolean | null;
  created_at: string;
};

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = hashPartnerShareToken(token);
  const supabase = await createCookieBackedSupabaseClient();

  const { data: usable, error: usableError } = await supabase.rpc('is_partner_share_link_usable', {
    p_token_hash: tokenHash,
  });

  if (usableError || usable !== true) {
    return NextResponse.json({ error: 'partner_link_not_found' }, { status: 404 });
  }

  const audited = createAuditedSupabaseServiceRoleClient();
  const { data, error } = await audited.withAudit(
    {
      actor: `partner-token:${tokenHash.slice(0, 12)}`,
      route: '/api/partner/[token]/community',
      target_type: 'community_posts',
      target_id: null,
      action: 'read_partner_feed',
    },
    async (client) => client
      .from('community_posts')
      .select('id, body, mood, sub_category, audience, audience_scope, audience_role, moderation_status, is_official, created_at')
      .or('audience_scope.eq.everyone,and(audience_scope.eq.same_role,audience_role.eq.partner)')
      .eq('moderation_status', 'approved')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
  );

  if (error) return NextResponse.json({ error: 'partner_community_unavailable' }, { status: 500 });

  return NextResponse.json(
    { posts: ((data as CommunityPostRow[] | null) ?? []).map(toCommunityPost) },
    { headers: { 'cache-control': 'no-store' } },
  );
}

function toCommunityPost(row: CommunityPostRow): CommunityPostListItem {
  return {
    id: row.id,
    body: row.body,
    mood: row.mood,
    subCategory: row.sub_category,
    audience: row.audience,
    audienceScope: row.audience_scope === 'same_role' ? 'same_role' : 'everyone',
    audienceRole: row.audience_role === 'primary' || row.audience_role === 'partner' ? row.audience_role : null,
    moderationStatus: row.moderation_status,
    isOfficial: row.is_official === true,
    createdAt: row.created_at,
  };
}
