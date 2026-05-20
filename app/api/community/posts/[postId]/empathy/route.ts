import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../../../src/lib/server-supabase';

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type ExistingEmpathyRow = { id: string };

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!isUuid(postId)) return NextResponse.json({ error: 'invalid_post' }, { status: 400 });

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const actor = await resolveCommunityActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'community_actor_not_found' }, { status: 403 });

  const post = await supabase
    .from('community_posts')
    .select('id, audience_scope, audience_role')
    .eq('id', postId)
    .eq('moderation_status', 'approved')
    .is('deleted_at', null)
    .maybeSingle();
  if (post.error) return NextResponse.json({ error: 'community_post_unavailable' }, { status: 500 });
  if (!post.data) return NextResponse.json({ error: 'community_post_not_found' }, { status: 404 });

  const existing = await supabase
    .from('community_post_empathies')
    .select('id')
    .eq('post_id', postId)
    .eq('actor_couple_id', actor.couple_id)
    .eq('actor_role', actor.role)
    .maybeSingle();

  if (existing.error) return NextResponse.json({ error: 'community_empathy_unavailable' }, { status: 500 });

  const existingRow = existing.data as ExistingEmpathyRow | null;
  if (existingRow?.id) {
    const { error } = await supabase.from('community_post_empathies').delete().eq('id', existingRow.id);
    if (error) return NextResponse.json({ error: 'community_empathy_unavailable' }, { status: 500 });
    const count = await countPostEmpathies(supabase, postId);
    return NextResponse.json({ active: false, count });
  }

  const { error } = await supabase.from('community_post_empathies').insert({
    post_id: postId,
    actor_couple_id: actor.couple_id,
    actor_role: actor.role,
  });
  if (error) return NextResponse.json({ error: 'community_empathy_unavailable' }, { status: 500 });

  const count = await countPostEmpathies(supabase, postId);
  return NextResponse.json({ active: true, count });
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

async function countPostEmpathies(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  postId: string,
) {
  const { count } = await supabase
    .from('community_post_empathies')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);
  return count ?? 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}
