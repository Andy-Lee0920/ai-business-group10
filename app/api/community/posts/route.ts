import { NextResponse, type NextRequest } from 'next/server';
import { runDeterministicModerationFilter, type ModerationFilterRule } from '../../../../src/domain/community-moderation';
import type { CommunityAudienceScope, CommunitySubCategory } from '../../../../src/types/community.types';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

interface CommunityPostBody {
  body?: unknown;
  mood?: unknown;
  subCategory?: unknown;
  audienceScope?: unknown;
  audienceRole?: unknown;
  photoUrls?: unknown;
}

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type CommunityIdentityRow = { id: string; couple_id: string; role: 'primary' | 'partner'; nickname: string };
type ModerationRuleRow = { rule_type: 'keyword' | 'regex'; pattern: string; severity: 'low' | 'medium' | 'high'; active: boolean };
type CommunityPostRow = Record<string, unknown> & { photo_urls?: string[] | null };
const COMMUNITY_PHOTOS_BUCKET = 'community-post-photos';

export async function GET(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const audienceScope = normalizeAudienceScope(url.searchParams.get('audienceScope'));
  const subCategory = normalizeSubCategory(url.searchParams.get('subCategory'));
  let query = supabase
    .from('community_posts')
    .select('id, body, mood, sub_category, audience, audience_scope, audience_role, moderation_status, is_official, photo_urls, created_at, community_identity_id')
    .eq('moderation_status', 'approved')
    .is('deleted_at', null)
    .order('is_official', { ascending: false })
    .order('created_at', { ascending: false });
  if (audienceScope) query = query.eq('audience_scope', audienceScope);
  if (subCategory) query = query.eq('sub_category', subCategory);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: 'community_posts_unavailable' }, { status: 500 });
  return NextResponse.json({ posts: await signCommunityPostRows(supabase, (data ?? []) as CommunityPostRow[]) });
}

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as CommunityPostBody;
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const subCategory = normalizeSubCategory(body.subCategory);
  const audienceScope = normalizeAudienceScope(body.audienceScope) ?? 'everyone';
  const requestedPhotoUrls = extractRequestedPhotoUrls(body.photoUrls);
  const photoUrls = normalizeCommunityPhotoUrls(body.photoUrls, user.id);
  if (body.audienceRole !== undefined) return NextResponse.json({ error: 'audience_role_server_owned' }, { status: 400 });
  if (!text || !subCategory) return NextResponse.json({ error: 'invalid_post' }, { status: 400 });
  if (requestedPhotoUrls.length !== photoUrls.length) return NextResponse.json({ error: 'invalid_photo_urls' }, { status: 400 });

  const actor = await resolveCommunityActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'community_actor_not_found' }, { status: 403 });

  const identity = await getOrCreateCommunityIdentity(supabase, user.id, actor);
  if (!identity) return NextResponse.json({ error: 'community_identity_unavailable' }, { status: 500 });

  const audited = createAuditedSupabaseServiceRoleClient();
  const rules = await audited.withAudit(
    { actor: user.id, route: '/api/community/posts', target_type: 'moderation_filter_rules', target_id: null, action: 'read' },
    async (client) => {
      const { data } = await client.from('moderation_filter_rules').select('rule_type, pattern, severity, active').eq('active', true);
      return ((data ?? []) as ModerationRuleRow[]).map(toModerationRule);
    },
  );
  const moderation = runDeterministicModerationFilter(text, rules);

  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({
      community_identity_id: identity.id,
      body: text,
      mood: typeof body.mood === 'string' && body.mood.trim() ? body.mood.trim() : null,
      sub_category: subCategory,
      photo_urls: photoUrls,
      audience: actor.role === 'partner' ? 'partner_feed' : 'primary_feed',
      audience_scope: audienceScope,
      audience_role: audienceScope === 'same_role' ? actor.role : null,
      moderation_status: 'pending',
    })
    .select('id, body, mood, sub_category, photo_urls, audience, audience_scope, audience_role, moderation_status, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'community_post_insert_failed' }, { status: 500 });
  const [signedPost] = await signCommunityPostRows(supabase, [post as CommunityPostRow]);
  return NextResponse.json({ post: signedPost, moderation: { ...moderation, status: 'pending' } }, { status: 201 });
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

async function getOrCreateCommunityIdentity(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
  actor: CoupleMemberRow,
): Promise<CommunityIdentityRow | null> {
  const existing = await supabase
    .from('community_identities')
    .select('id, couple_id, role, nickname')
    .eq('couple_id', actor.couple_id)
    .eq('role', actor.role)
    .maybeSingle();
  if (existing.data) return existing.data as CommunityIdentityRow;

  const nickname = `페비오-${actor.role}-${actor.couple_id.slice(0, 8)}`;
  const created = await supabase
    .from('community_identities')
    .insert({ user_id: userId, couple_id: actor.couple_id, role: actor.role, nickname })
    .select('id, couple_id, role, nickname')
    .single();
  return created.data ? created.data as CommunityIdentityRow : null;
}

function toModerationRule(row: ModerationRuleRow): ModerationFilterRule {
  return { ruleType: row.rule_type, pattern: row.pattern, severity: row.severity, active: row.active };
}

function normalizeAudienceScope(value: unknown): CommunityAudienceScope | null {
  return value === 'everyone' || value === 'same_role' ? value : null;
}

function normalizeSubCategory(value: unknown): CommunitySubCategory | null {
  return value === 'pain' || value === 'worry' || value === 'today' || value === 'tip' ? value : null;
}

function normalizeCommunityPhotoUrls(value: unknown, userId: string): string[] {
  const prefix = `${userId}/`;
  return extractRequestedPhotoUrls(value)
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.startsWith(prefix))
    .filter((candidate) => !candidate.includes('..') && !candidate.includes('//'))
    .filter((candidate) => /\.(jpe?g|png|webp|heic|heif)$/iu.test(candidate))
    .slice(0, 4);
}

function extractRequestedPhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0).slice(0, 5);
}

async function signCommunityPostRows(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  rows: CommunityPostRow[],
) {
  return Promise.all(rows.map(async (row) => ({
    ...row,
    photo_urls: await signCommunityPhotoUrls(supabase, row.photo_urls),
  })));
}

async function signCommunityPhotoUrls(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  value: unknown,
) {
  const paths = Array.isArray(value) ? value.filter((url): url is string => typeof url === 'string') : [];
  const signed = await Promise.all(paths.slice(0, 4).map(async (path) => {
    if (/^(https?:)?\/\//u.test(path) || path.startsWith('/')) return path;
    const { data } = await supabase.storage.from(COMMUNITY_PHOTOS_BUCKET).createSignedUrl(path, 60 * 30);
    return data?.signedUrl ?? null;
  }));
  return signed.filter((url): url is string => Boolean(url));
}
