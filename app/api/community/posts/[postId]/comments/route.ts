import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../../../src/lib/server-supabase';

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type CommunityIdentityRow = { id: string; couple_id: string; role: 'primary' | 'partner'; nickname: string };

type CommentBody = { body?: unknown; parentCommentId?: unknown };

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!isUuid(postId)) return NextResponse.json({ error: 'invalid_post' }, { status: 400 });

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const actor = await resolveCommunityActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'community_actor_not_found' }, { status: 403 });
  const post = await requireVisiblePost(supabase, postId, actor.role);
  if (!post) return NextResponse.json({ error: 'community_post_not_found' }, { status: 404 });

  const { data, error } = await supabase
    .from('community_comments')
    .select('id, post_id, parent_comment_id, body, moderation_status, created_at, community_identities(nickname)')
    .eq('post_id', postId)
    .eq('moderation_status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'community_comments_unavailable' }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!isUuid(postId)) return NextResponse.json({ error: 'invalid_post' }, { status: 400 });

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as CommentBody;
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const parentCommentId = typeof body.parentCommentId === 'string' && isUuid(body.parentCommentId) ? body.parentCommentId : null;
  if (!text) return NextResponse.json({ error: 'invalid_comment' }, { status: 400 });

  const actor = await resolveCommunityActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'community_actor_not_found' }, { status: 403 });
  const post = await requireVisiblePost(supabase, postId, actor.role);
  if (!post) return NextResponse.json({ error: 'community_post_not_found' }, { status: 404 });

  const identity = await getOrCreateCommunityIdentity(supabase, user.id, actor);
  if (!identity) return NextResponse.json({ error: 'community_identity_unavailable' }, { status: 500 });

  const { data: comment, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      parent_comment_id: parentCommentId,
      community_identity_id: identity.id,
      body: text,
      moderation_status: 'pending',
    })
    .select('id, post_id, parent_comment_id, body, moderation_status, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'community_comment_insert_failed' }, { status: 500 });
  return NextResponse.json({ comment }, { status: 201 });
}

async function requireVisiblePost(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  postId: string,
  role: CoupleMemberRow['role'],
) {
  const { data, error } = await supabase
    .from('community_posts')
    .select('id')
    .eq('id', postId)
    .eq('audience', role === 'partner' ? 'partner_feed' : 'primary_feed')
    .eq('moderation_status', 'approved')
    .is('deleted_at', null)
    .maybeSingle();
  return error ? null : data;
}

async function resolveCommunityActor(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
): Promise<CoupleMemberRow | null> {
  const { data, error } = await supabase.from('couple_members').select('couple_id, role').eq('user_id', userId).limit(1).maybeSingle();
  if (error || !data) return null;
  const row = data as CoupleMemberRow;
  return row.role === 'primary' || row.role === 'partner' ? row : null;
}

async function getOrCreateCommunityIdentity(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
  actor: CoupleMemberRow,
): Promise<CommunityIdentityRow | null> {
  const existing = await supabase.from('community_identities').select('id, couple_id, role, nickname').eq('couple_id', actor.couple_id).eq('role', actor.role).maybeSingle();
  if (existing.data) return existing.data as CommunityIdentityRow;
  const nickname = `페비오-${actor.role}-${actor.couple_id.slice(0, 8)}`;
  const created = await supabase.from('community_identities').insert({ user_id: userId, couple_id: actor.couple_id, role: actor.role, nickname }).select('id, couple_id, role, nickname').single();
  return created.data ? created.data as CommunityIdentityRow : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}
