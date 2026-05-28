import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type JournalBody = { body?: unknown; mood?: unknown; painScore?: unknown; photoUrls?: unknown };
const JOURNAL_PHOTOS_BUCKET = 'couple-journal-photos';

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const actor = await resolveActor(supabase, user.id);
  if (!actor) return NextResponse.json({ entries: [] });

  const { data, error } = await supabase
    .from('couple_journal_entries')
    .select('id, body, mood, pain_score, photo_urls, author_role, created_at')
    .eq('couple_id', actor.couple_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'journal_unavailable' }, { status: 500 });
  return NextResponse.json({ entries: await Promise.all((data ?? []).map((row) => toJournalEntry(supabase, row))) });
}

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const actor = await resolveActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'journal_actor_not_found' }, { status: 403 });
  if (!await hasApprovedPartnerLink(supabase, actor.couple_id)) {
    return NextResponse.json({ error: 'partner_link_required' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as JournalBody;
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return NextResponse.json({ error: 'journal_body_required' }, { status: 400 });

  const painScore = normalizePainScore(body.painScore);
  const photoUrls = normalizePhotoUrls(body.photoUrls, actor.couple_id);
  const { data, error } = await supabase
    .from('couple_journal_entries')
    .insert({
      couple_id: actor.couple_id,
      author_id: user.id,
      author_role: actor.role,
      body: text,
      mood: normalizeMood(body.mood),
      pain_score: actor.role === 'primary' ? painScore : null,
      photo_urls: photoUrls,
    })
    .select('id, body, mood, pain_score, photo_urls, author_role, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'journal_insert_failed' }, { status: 500 });
  return NextResponse.json({ entry: await toJournalEntry(supabase, data) }, { status: 201 });
}

async function resolveActor(
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

async function hasApprovedPartnerLink(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  coupleId: string,
) {
  const { data: primaryMember } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId)
    .eq('role', 'primary')
    .limit(1)
    .maybeSingle();
  const primaryUserId = typeof primaryMember?.user_id === 'string' ? primaryMember.user_id : null;
  if (!primaryUserId) return false;
  const { data, error } = await supabase
    .from('partner_links')
    .select('id')
    .eq('patient_id', primaryUserId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();
  return !error && Boolean(data?.id);
}

function normalizeMood(value: unknown) {
  return value === 'calm' || value === 'tired' || value === 'worried' || value === 'hopeful' || value === 'unknown' ? value : null;
}

function normalizePainScore(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 10) return null;
  return numberValue;
}

function normalizePhotoUrls(value: unknown, coupleId: string) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((candidate): candidate is string => typeof candidate === 'string')
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.startsWith(`${coupleId}/`))
    .slice(0, 6);
}

async function signJournalPhotoUrls(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  value: unknown,
) {
  const paths = Array.isArray(value) ? value.filter((url): url is string => typeof url === 'string' && url.trim().length > 0) : [];
  const signed = await Promise.all(paths.map(async (path) => {
    if (/^https?:\/\//iu.test(path)) return path;
    const { data } = await supabase.storage.from(JOURNAL_PHOTOS_BUCKET).createSignedUrl(path, 60 * 30);
    return data?.signedUrl ?? null;
  }));
  return signed.filter((url): url is string => typeof url === 'string');
}

async function toJournalEntry(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  row: Record<string, unknown>,
) {
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood : null,
    painScore: typeof row.pain_score === 'number' ? row.pain_score : null,
    photoUrls: await signJournalPhotoUrls(supabase, row.photo_urls),
    authorRole: row.author_role === 'partner' ? 'partner' : 'primary',
    createdAt: String(row.created_at),
  };
}
