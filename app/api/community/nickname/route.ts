import { NextResponse, type NextRequest } from 'next/server';
import { normalizeCommunityNickname } from '../../../../src/domain/community-identity';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';
const NICKNAME_COOLDOWN_DAYS = 30;

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };
type IdentityRow = { id: string; nickname: string; last_changed_at: string | null };

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { nickname?: unknown };
  const nickname = normalizeCommunityNickname(typeof body.nickname === 'string' ? body.nickname : '');
  if (nickname.length < 2) return NextResponse.json({ error: 'nickname_too_short' }, { status: 400 });

  const actor = await resolveActor(supabase, user.id);
  if (!actor) return NextResponse.json({ error: 'community_actor_not_found' }, { status: 403 });

  const existing = await supabase
    .from('community_identities')
    .select('id, nickname, last_changed_at')
    .eq('couple_id', actor.couple_id)
    .eq('role', actor.role)
    .maybeSingle();

  const existingRow = existing.data as IdentityRow | null;
  const remainingDays = remainingCooldownDays(existingRow?.last_changed_at ?? null);
  if (existingRow?.id && remainingDays > 0) return NextResponse.json({ error: 'nickname_cooldown', remainingDays }, { status: 429 });

  const mutation = existingRow?.id
    ? supabase.from('community_identities').update({ nickname, last_changed_at: new Date().toISOString() }).eq('id', existingRow.id).select('nickname, last_changed_at').single()
    : supabase.from('community_identities').insert({ user_id: user.id, couple_id: actor.couple_id, role: actor.role, nickname, last_changed_at: new Date().toISOString() }).select('nickname, last_changed_at').single();
  const { data, error } = await mutation;
  if (error) return NextResponse.json({ error: 'nickname_update_failed' }, { status: 500 });
  return NextResponse.json({ identity: data, remainingDays: NICKNAME_COOLDOWN_DAYS });
}

async function resolveActor(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
): Promise<CoupleMemberRow | null> {
  const { data, error } = await supabase.from('couple_members').select('couple_id, role').eq('user_id', userId).limit(1).maybeSingle();
  if (error || !data) return null;
  const row = data as CoupleMemberRow;
  return row.role === 'primary' || row.role === 'partner' ? row : null;
}

function remainingCooldownDays(lastChangedAt: string | null) {
  if (!lastChangedAt) return 0;
  const changedAt = new Date(lastChangedAt).getTime();
  if (Number.isNaN(changedAt)) return 0;
  const elapsedDays = Math.floor((Date.now() - changedAt) / (24 * 60 * 60 * 1000));
  return Math.max(0, NICKNAME_COOLDOWN_DAYS - elapsedDays);
}
