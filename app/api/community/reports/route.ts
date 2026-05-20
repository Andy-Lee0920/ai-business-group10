import { NextResponse, type NextRequest } from 'next/server';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

type ReportTargetType = 'post' | 'comment';
type ReportReason = 'medical_advice' | 'privacy' | 'harassment' | 'spam' | 'other';
type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type CommunityIdentityRow = { id: string; couple_id: string; role: 'primary' | 'partner' };
type ReportBody = { targetType?: unknown; targetId?: unknown; reason?: unknown };

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as ReportBody;
  const targetType = normalizeTargetType(body.targetType);
  const targetId = typeof body.targetId === 'string' ? body.targetId : '';
  const reason = normalizeReason(body.reason);
  if (!targetType || !isUuid(targetId) || !reason) return NextResponse.json({ error: 'invalid_report' }, { status: 400 });

  const identity = await resolveReporterIdentity(supabase, user.id);
  if (!identity) return NextResponse.json({ error: 'community_identity_unavailable' }, { status: 403 });

  const audited = createAuditedSupabaseServiceRoleClient();
  const authorIdentityId = await audited.withAudit(
    { actor: user.id, route: '/api/community/reports', target_type: targetType, target_id: targetId, action: 'read_report_target' },
    (client) => readTargetAuthorIdentityId(client, targetType, targetId),
  );
  if (!authorIdentityId) return NextResponse.json({ error: 'report_target_not_found' }, { status: 404 });
  if (authorIdentityId === identity.id) return NextResponse.json({ error: 'self_report_not_allowed' }, { status: 400 });

  const { data, error } = await supabase
    .from('community_reports')
    .insert({
      reporter_identity_id: identity.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    })
    .select('id, target_type, target_id, reason, resolved_status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'duplicate_report' }, { status: 409 });
    return NextResponse.json({ error: 'community_report_insert_failed' }, { status: 500 });
  }
  return NextResponse.json({ report: data }, { status: 201 });
}

async function readTargetAuthorIdentityId(
  client: Parameters<Parameters<ReturnType<typeof createAuditedSupabaseServiceRoleClient>['withAudit']>[1]>[0],
  targetType: ReportTargetType,
  targetId: string,
) {
  const table = targetType === 'post' ? 'community_posts' : 'community_comments';
  const { data, error } = await client.from(table).select('community_identity_id').eq('id', targetId).maybeSingle();
  if (error || !data || typeof data.community_identity_id !== 'string') return null;
  return data.community_identity_id;
}

async function resolveReporterIdentity(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
): Promise<CommunityIdentityRow | null> {
  const actor = await resolveCommunityActor(supabase, userId);
  if (!actor) return null;
  const { data } = await supabase
    .from('community_identities')
    .select('id, couple_id, role')
    .eq('couple_id', actor.couple_id)
    .eq('role', actor.role)
    .maybeSingle();
  return data ? data as CommunityIdentityRow : null;
}

async function resolveCommunityActor(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
): Promise<CoupleMemberRow | null> {
  const { data, error } = await supabase
    .from('couple_members')
    .select('couple_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as CoupleMemberRow;
  return row.role === 'primary' || row.role === 'partner' ? row : null;
}

function normalizeTargetType(value: unknown): ReportTargetType | null {
  return value === 'post' || value === 'comment' ? value : null;
}

function normalizeReason(value: unknown): ReportReason | null {
  return value === 'medical_advice' || value === 'privacy' || value === 'harassment' || value === 'spam' || value === 'other' ? value : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}
