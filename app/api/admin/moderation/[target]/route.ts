import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminUser } from '../../../../../src/lib/admin-auth';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

type ModerationTarget = 'post' | 'comment';
type ModerationAction = 'approve' | 'reject';
type ModerationBody = { id?: unknown; action?: unknown };

export async function POST(request: NextRequest, { params }: { params: Promise<{ target: string }> }) {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await requireAdminUser(supabase);
  if (admin instanceof NextResponse) return admin;

  const { target: rawTarget } = await params;
  const target = normalizeTarget(rawTarget);
  const body = (await request.json().catch(() => ({}))) as ModerationBody;
  const id = typeof body.id === 'string' ? body.id : '';
  const action = normalizeAction(body.action);
  if (!target || !isUuid(id) || !action) return NextResponse.json({ error: 'invalid_moderation_action' }, { status: 400 });

  const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
  const table = target === 'post' ? 'community_posts' : 'community_comments';
  const audited = createAuditedSupabaseServiceRoleClient();
  const result = await audited.withAudit(
    { actor: admin.email, route: `/api/admin/moderation/${target}`, target_type: table, target_id: id, action },
    async (client) => client.from(table).update({ moderation_status: nextStatus }).eq('id', id).select('id, moderation_status').single(),
  );

  if (result.error) return NextResponse.json({ error: 'moderation_update_failed' }, { status: 500 });
  return NextResponse.json({ item: result.data, moderation_status: nextStatus });
}

function normalizeTarget(value: string): ModerationTarget | null {
  return value === 'post' || value === 'comment' ? value : null;
}

function normalizeAction(value: unknown): ModerationAction | null {
  return value === 'approve' || value === 'reject' ? value : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}
