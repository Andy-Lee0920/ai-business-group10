import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { CommunityNicknameForm } from '../../../../src/features/more/community-nickname-form';

export const dynamic = 'force-dynamic';
const NICKNAME_COOLDOWN_DAYS = 30;

export default async function CommunityNicknamePage() {
  const requestHeaders = await headers();
  const presentationMode = isPresentationRequest({ headers: requestHeaders });
  if (presentationMode) {
    return <CommunityNicknameContent nickname="페비오 사용자" remainingDays={0} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const { data: member } = await supabase.from('couple_members').select('couple_id, role').eq('user_id', user.id).limit(1).maybeSingle();
  const coupleId = typeof member?.couple_id === 'string' ? member.couple_id : null;
  const role = member?.role === 'partner' ? 'partner' : 'primary';
  const { data: identity } = coupleId
    ? await supabase.from('community_identities').select('nickname, last_changed_at').eq('couple_id', coupleId).eq('role', role).maybeSingle()
    : { data: null };
  const nickname = typeof identity?.nickname === 'string' ? identity.nickname : '';
  const remainingDays = remainingCooldownDays(typeof identity?.last_changed_at === 'string' ? identity.last_changed_at : null);

  return <CommunityNicknameContent nickname={nickname} remainingDays={remainingDays} />;
}

function CommunityNicknameContent({ nickname, remainingDays }: { nickname: string; remainingDays: number }) {
  return (
    <main style={{ minHeight: '100dvh', padding: '54px 20px 112px', background: 'var(--slc-bg)' }}>
      <Link href="/settings" style={{ color: 'var(--slc-muted)', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>← 설정</Link>
      <section style={{ marginTop: 18, borderRadius: 24, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--slc-border)', padding: 20 }}>
        <p style={{ margin: '0 0 6px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 }}>공유 기록</p>
        <h1 style={{ margin: '0 0 10px', color: 'var(--slc-text)', fontSize: 24, fontWeight: 950, letterSpacing: '-0.03em' }}>공유 이름 수정</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750, lineHeight: 1.5 }}>공개 피드에 남긴 확인 기록에서만 쓰이는 이름입니다. 치료 일정과 의료정보는 함께 노출하지 않습니다.</p>
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
