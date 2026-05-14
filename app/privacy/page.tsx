import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const PRIVACY_GATE_COOKIE = 'fevio_privacy_gate_v1';

interface PrivacyPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params?.next);
  const cookieStore = await cookies();

  if (cookieStore.get(PRIVACY_GATE_COOKIE)?.value === 'accepted') {
    redirect(nextPath);
  }

  async function acceptPrivacy(formData: FormData) {
    'use server';
    const cookieStore = await cookies();
    cookieStore.set(PRIVACY_GATE_COOKIE, 'accepted', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    const requestedNext = formData.get('next');
    redirect(safeNextPath(typeof requestedNext === 'string' ? requestedNext : undefined));
  }

  return (
    <main className="app-shell" style={{ background: 'var(--slc-bg)', display: 'grid', placeItems: 'center' }}>
      <section data-testid="privacy-gate-card" aria-labelledby="privacy-title" style={{ width: '100%', maxWidth: 390, background: 'var(--slc-card)', border: '1px solid var(--slc-border)', borderRadius: 28, padding: 24, boxShadow: '0 18px 48px rgba(106, 72, 58, 0.12)' }}>
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontWeight: 700, fontSize: 13 }}>개인정보 보호 안내</p>
        <h1 id="privacy-title" style={{ margin: '0 0 18px', color: 'var(--slc-text)', fontSize: 24, lineHeight: 1.25 }}>시작 전에 저장 범위를 확인해 주세요</h1>
        <div style={{ display: 'grid', gap: 12, color: '#6B5E55', fontSize: 15, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>Fevio는 로그인 상태와 사용자가 직접 입력한 일정, 약명, 완료 여부를 저장합니다.</p>
          <p style={{ margin: 0 }}>이 정보는 오늘 할 일, 기록, 파트너 읽기 전용 화면을 만들기 위해 사용됩니다.</p>
          <p style={{ margin: 0 }}>자세한 내용은 <Link href="/privacy#details" style={{ color: 'var(--slc-coral)', fontWeight: 700 }}>개인정보 안내</Link>에서 확인할 수 있습니다.</p>
        </div>
        <form action={acceptPrivacy} style={{ marginTop: 24 }}>
          <input type="hidden" name="next" value={nextPath} />
          <button type="submit" style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 999, background: 'var(--slc-coral)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            확인하고 계속
          </button>
        </form>
        <p id="details" style={{ margin: '14px 0 0', color: '#9B8E86', fontSize: 12, lineHeight: 1.5 }}>
          Fevio는 의료 판단을 하지 않고 병원 안내를 기록·확인하는 도구입니다.
        </p>
      </section>
    </main>
  );
}

function safeNextPath(next: string | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/privacy')) return '/onboarding';
  return next;
}
