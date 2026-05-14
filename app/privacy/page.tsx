import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface PrivacyPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params?.next);

  async function acceptPrivacy(formData: FormData) {
    'use server';
    const cookieStore = await cookies();
    cookieStore.set('fevio_privacy_gate_v1', 'accepted', {
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
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontWeight: 700, fontSize: 13 }}>개인정보 게이트</p>
        <h1 id="privacy-title" style={{ margin: '0 0 18px', color: 'var(--slc-text)', fontSize: 24, lineHeight: 1.25 }}>서비스 이용 전 안내를 확인해 주세요</h1>
        <div style={{ display: 'grid', gap: 12, color: '#6B5E55', fontSize: 15, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>Fevio는 서비스 제공을 위해 로그인 상태와 기본 사용 설정을 저장합니다.</p>
          <p style={{ margin: 0 }}>앱에서는 이후 사용자가 직접 입력한 일정, 약명, 완료 여부 같은 정보가 저장될 수 있습니다.</p>
          <p style={{ margin: 0 }}>자세한 내용은 <Link href="/privacy#details" style={{ color: 'var(--slc-coral)', fontWeight: 700 }}>개인정보 안내</Link>에서 확인할 수 있습니다.</p>
        </div>
        <div id="details" style={{ marginTop: 18, padding: 14, borderRadius: 18, background: 'var(--slc-coral-light)', color: '#7A665C', fontSize: 13, lineHeight: 1.55 }}>
          Fevio는 의료 판단을 하지 않습니다. 병원에서 받은 처방과 사용자가 직접 입력한 일정만 저장합니다.
        </div>
        <form action={acceptPrivacy} style={{ marginTop: 24 }}>
          <input type="hidden" name="next" value={nextPath} />
          <button type="submit" style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 999, background: 'var(--slc-coral)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            확인하고 계속
          </button>
        </form>
      </section>
    </main>
  );
}

function safeNextPath(next: string | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/onboarding';
  return next;
}
