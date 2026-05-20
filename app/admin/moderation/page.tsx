import { AdminModerationPanel } from '../../../src/features/admin/admin-moderation-panel';
import { getAdminUser } from '../../../src/lib/admin-auth';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

export default async function AdminModerationPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await getAdminUser(supabase);
  if (!admin) return <AdminBlocked />;

  const audited = createAuditedSupabaseServiceRoleClient();
  const [posts, comments] = await Promise.all([
    audited.withAudit(
      { actor: admin.email, route: '/admin/moderation', target_type: 'community_posts', target_id: null, action: 'read_pending_ui' },
      async (client) => client.from('community_posts').select('id, body, moderation_status, created_at').eq('moderation_status', 'pending').is('deleted_at', null).order('created_at', { ascending: true }),
    ),
    audited.withAudit(
      { actor: admin.email, route: '/admin/moderation', target_type: 'community_comments', target_id: null, action: 'read_pending_ui' },
      async (client) => client.from('community_comments').select('id, body, moderation_status, created_at').eq('moderation_status', 'pending').is('deleted_at', null).order('created_at', { ascending: true }),
    ),
  ]);

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>검수 큐</h1>
      <p style={leadStyle}>closed beta 커뮤니티 글과 댓글을 승인하거나 거절합니다.</p>
      <AdminModerationPanel posts={posts.data ?? []} comments={comments.data ?? []} />
    </main>
  );
}

function AdminBlocked() {
  return <main style={pageStyle}><h1 style={titleStyle}>접근할 수 없습니다</h1><p style={leadStyle}>비-admin 사용자는 /admin/*에 접근할 수 없습니다.</p></main>;
}

const pageStyle = { minHeight: '100dvh', padding: '48px 20px 96px', background: 'var(--slc-bg)' } as const;
const titleStyle = { margin: 0, color: 'var(--slc-text)', fontSize: 30, fontWeight: 950, letterSpacing: '-0.05em' } as const;
const leadStyle = { color: 'var(--slc-muted)', fontSize: 14, fontWeight: 750, lineHeight: 1.5 } as const;
