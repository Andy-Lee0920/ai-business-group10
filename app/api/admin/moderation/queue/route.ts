import { NextResponse } from 'next/server';
import { requireAdminUser } from '../../../../../src/lib/admin-auth';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await requireAdminUser(supabase);
  if (admin instanceof NextResponse) return admin;

  const audited = createAuditedSupabaseServiceRoleClient();
  const [posts, comments] = await Promise.all([
    audited.withAudit(
      { actor: admin.email, route: '/api/admin/moderation/queue', target_type: 'community_posts', target_id: null, action: 'read_pending' },
      async (client) => client.from('community_posts').select('*').eq('moderation_status', 'pending').is('deleted_at', null).order('created_at', { ascending: true }),
    ),
    audited.withAudit(
      { actor: admin.email, route: '/api/admin/moderation/queue', target_type: 'community_comments', target_id: null, action: 'read_pending' },
      async (client) => client.from('community_comments').select('*').eq('moderation_status', 'pending').is('deleted_at', null).order('created_at', { ascending: true }),
    ),
  ]);

  if (posts.error || comments.error) return NextResponse.json({ error: 'moderation_queue_unavailable' }, { status: 500 });
  return NextResponse.json({ posts: posts.data ?? [], comments: comments.data ?? [] });
}
