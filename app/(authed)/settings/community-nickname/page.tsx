import Link from 'next/link';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { CommunityNicknameForm } from '../../../../src/features/more/community-nickname-form';

export const dynamic = 'force-dynamic';
const NICKNAME_COOLDOWN_DAYS = 30;

export default async function CommunityNicknamePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase.from('couple_members').select('couple_id, role').eq('user_id', user.id).limit(1).maybeSingle();
  const coupleId = typeof member?.couple_id === 'string' ? member.couple_id : null;
  const role = member?.role === 'partner' ? 'partner' : 'primary';
  const { data: identity } = coupleId
    ? await supabase.from('community_identities').select('nickname, last_changed_at').eq('couple_id', coupleId).eq('role', role).maybeSingle()
    : { data: null };
  const nickname = typeof identity?.nickname === 'string' ? identity.nickname : '';
  const remainingDays = remainingCooldownDays(typeof identity?.last_changed_at === 'string' ? identity.last_changed_at : null);

  return (
    <main style={{ minHeight: '100dvh', padding: '54px 20px 112px', background: 'var(--slc-bg)' }}>
      <Link href="/settings" style={{ color: 'var(--slc-muted)', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>← 설정</Link>
      <section style={{ marginTop: 18, borderRadius: 24, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--slc-border)', padding: 20 }}>
        <p style={{ margin: '0 0 6px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 }}>커뮤니티</p>
        <h1 style={{ margin: '0 0 10px', color: 'var(--slc-text)', fontSize: 24, fontWeight: 950, letterSpacing: '-0.05em' }}>닉네임 수정</h1>
        <CommunityNicknameForm nickname={nickname} remainingDays={remainingDays} />
      </section>
    </main>
  );
}

function remainingCooldownDays(lastChangedAt: string | null) {
  if (!lastChangedAt) return 0;
  const changedAt = new Date(lastChangedAt).getTime();
  if (Number.isNaN(changedAt)) return 0;
  const elapsedDays = Math.floor((Date.now() - changedAt) / (24 * 60 * 60 * 1000));
  return Math.max(0, NICKNAME_COOLDOWN_DAYS - elapsedDays);
}
