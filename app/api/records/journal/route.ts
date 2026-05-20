import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type JournalBody = { body?: unknown; mood?: unknown; painScore?: unknown };

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
  return NextResponse.json({ entries: (data ?? []).map(toJournalEntry) });
}

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const actor = await resolveActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'journal_actor_not_found' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as JournalBody;
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return NextResponse.json({ error: 'journal_body_required' }, { status: 400 });

  const painScore = normalizePainScore(body.painScore);
  const { data, error } = await supabase
    .from('couple_journal_entries')
    .insert({
      couple_id: actor.couple_id,
      author_id: user.id,
      author_role: actor.role,
      body: text,
      mood: normalizeMood(body.mood),
      pain_score: actor.role === 'primary' ? painScore : null,
      photo_urls: [],
    })
    .select('id, body, mood, pain_score, photo_urls, author_role, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'journal_insert_failed' }, { status: 500 });
  return NextResponse.json({ entry: toJournalEntry(data) }, { status: 201 });
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

function normalizeMood(value: unknown) {
  return value === 'calm' || value === 'tired' || value === 'worried' || value === 'hopeful' || value === 'unknown' ? value : null;
}

function normalizePainScore(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 10) return null;
  return numberValue;
}

function toJournalEntry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood : null,
    painScore: typeof row.pain_score === 'number' ? row.pain_score : null,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls.filter((url): url is string => typeof url === 'string') : [],
    authorRole: row.author_role === 'partner' ? 'partner' : 'primary',
    createdAt: String(row.created_at),
  };
}
