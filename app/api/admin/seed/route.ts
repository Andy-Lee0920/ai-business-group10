import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminUser } from '../../../../src/lib/admin-auth';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import type { CommunityAudience, CommunitySubCategory } from '../../../../src/types/community.types';

export const dynamic = 'force-dynamic';

type SeedBody = { body?: unknown; audience?: unknown; subCategory?: unknown; identityId?: unknown };

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await requireAdminUser(supabase);
  if (admin instanceof NextResponse) return admin;

  const body = (await request.json().catch(() => ({}))) as SeedBody;
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const audience = normalizeAudience(body.audience);
  const subCategory = normalizeSubCategory(body.subCategory);
  const explicitIdentityId = typeof body.identityId === 'string' ? body.identityId : null;
  if (!text || !audience || !subCategory) return NextResponse.json({ error: 'invalid_seed_post' }, { status: 400 });

  const audited = createAuditedSupabaseServiceRoleClient();
  const identityId = explicitIdentityId ?? await audited.withAudit(
    { actor: admin.email, route: '/api/admin/seed', target_type: 'community_identities', target_id: null, action: 'find_seed_identity' },
    async (client) => {
      const role = audience === 'partner_feed' ? 'partner' : 'primary';
      const { data } = await client.from('community_identities').select('id').eq('role', role).order('created_at', { ascending: true }).limit(1).maybeSingle();
      return typeof data?.id === 'string' ? data.id : null;
    },
  );
  if (!identityId) return NextResponse.json({ error: 'official_identity_required', label: '운영팀 안내' }, { status: 409 });

  const result = await audited.withAudit(
    { actor: admin.email, route: '/api/admin/seed', target_type: 'community_posts', target_id: null, action: 'seed_official_post' },
    async (client) => client.from('community_posts').insert({
      community_identity_id: identityId,
      body: text,
      mood: null,
      sub_category: subCategory,
      audience,
      moderation_status: 'approved',
      is_official: true,
    }).select('id, body, audience, moderation_status, is_official, created_at').single(),
  );

  if (result.error) return NextResponse.json({ error: 'seed_post_failed' }, { status: 500 });
  return NextResponse.json({ post: result.data, label: '운영팀 안내' }, { status: 201 });
}

function normalizeAudience(value: unknown): CommunityAudience | null {
  return value === 'primary_feed' || value === 'partner_feed' ? value : null;
}

function normalizeSubCategory(value: unknown): CommunitySubCategory | null {
  return value === 'pain' || value === 'worry' || value === 'today' || value === 'tip' ? value : null;
}
