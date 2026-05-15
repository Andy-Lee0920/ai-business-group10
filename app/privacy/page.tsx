import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

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

  return (
    <main
      className="app-shell"
      style={{
        background:
          'radial-gradient(circle at 16% 8%, rgba(255, 236, 224, 0.96), transparent 38%), linear-gradient(180deg, #FFFDFC 0%, #FAF4EF 100%)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <section
        data-testid="privacy-gate-card"
        aria-labelledby="privacy-title"
        style={{
          width: '100%',
          maxWidth: 372,
          border: '1px solid rgba(210, 198, 187, 0.62)',
          borderRadius: 36,
          background: 'rgba(255, 255, 255, 0.86)',
          boxShadow: '0 28px 78px rgba(105, 81, 68, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.96)',
          padding: '32px 28px 26px',
          backdropFilter: 'blur(18px)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            display: 'grid',
            placeItems: 'center',
            background: '#FFF8F4',
            color: 'var(--slc-coral)',
            boxShadow: '0 18px 38px rgba(149, 94, 72, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.88)',
            marginBottom: 34,
          }}
        >
          <ShieldIcon />
        </span>

        <p style={{ margin: '0 0 12px', color: 'var(--slc-coral)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>
          개인정보 보호 안내
        </p>
        <h1
          id="privacy-title"
          style={{
            margin: 0,
            color: 'var(--slc-text)',
            fontSize: 35,
            lineHeight: 1.24,
            letterSpacing: '-0.06em',
            wordBreak: 'keep-all',
          }}
        >
          시작 전에 저장 범위를 확인해 주세요
        </h1>

        <span aria-hidden="true" style={{ display: 'block', width: 39, height: 1, background: '#E9D9CF', margin: '28px 0 22px' }} />

        <div style={{ color: '#4F4640', fontSize: 17, lineHeight: 1.72, letterSpacing: '-0.035em' }}>
          <PrivacyInfoRow icon="person">
            Fevio는 로그인 상태와 사용자가 직접 입력한 일정, 약명, 완료 여부를 저장합니다.
          </PrivacyInfoRow>
          <PrivacyInfoRow icon="document">
            이 정보는 오늘 할 일, 기록, 파트너 읽기 전용 화면을 만들기 위해 사용됩니다.
          </PrivacyInfoRow>
          <PrivacyInfoRow icon="book" isLast>
            자세한 내용은 <Link href="/privacy#details" style={{ color: 'var(--slc-coral)', fontWeight: 800 }}>개인정보 안내</Link>에서 확인할 수 있습니다.
          </PrivacyInfoRow>
        </div>

        <form action="/api/privacy/accept" method="post" style={{ marginTop: 28 }}>
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            style={{
              width: '100%',
              minHeight: 66,
              border: 0,
              borderRadius: 999,
              background: 'linear-gradient(135deg, #E96E5B 0%, #D15B49 100%)',
              color: '#fff',
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              padding: '0 24px 0 42px',
              boxShadow: '0 18px 34px rgba(196, 97, 74, 0.26)',
            }}
          >
            <span>확인하고 계속</span>
            <ArrowIcon />
          </button>
        </form>

        <div style={{ height: 1, background: '#EFE3DB', margin: '26px 0 18px' }} />
        <p
          id="details"
          style={{
            margin: 0,
            display: 'grid',
            gridTemplateColumns: '24px 1fr',
            gap: 12,
            alignItems: 'start',
            color: '#8D827B',
            fontSize: 14,
            lineHeight: 1.62,
            letterSpacing: '-0.035em',
          }}
        >
          <span aria-hidden="true" style={{ color: '#A79E98', display: 'grid', placeItems: 'center', paddingTop: 1 }}>
            <SmallShieldIcon />
          </span>
          <span>Fevio는 의료 판단을 하지 않고 병원 안내를 기록·확인하는 도구입니다.</span>
        </p>
      </section>
    </main>
  );
}

function safeNextPath(next: string | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/privacy')) return '/onboarding';
  return next;
}

function PrivacyInfoRow({ icon, children, isLast = false }: { icon: 'person' | 'document' | 'book'; children: ReactNode; isLast?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr',
        gap: 14,
        alignItems: 'center',
        padding: isLast ? '18px 0 0' : '18px 0',
        borderBottom: isLast ? 'none' : '1px solid #EFE3DB',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 50,
          height: 50,
          borderRadius: 18,
          background: '#FFF4EF',
          color: 'var(--slc-coral)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <PrivacyIcon icon={icon} />
      </span>
      <p style={{ margin: 0, wordBreak: 'keep-all' }}>{children}</p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <path d="M19 4.5 30.4 8.7v8.55c0 7.06-4.73 13.63-11.4 16.05C12.33 30.88 7.6 24.31 7.6 17.25V8.7L19 4.5Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="m13.9 19.1 3.25 3.2 7.25-7.35" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmallShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 5.7v5.5c0 4.65-2.82 8.85-7 10.3-4.18-1.45-7-5.65-7-10.3V5.7L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12.2 2 2 4-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="m11 7 7 7-7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrivacyIcon({ icon }: { icon: 'person' | 'document' | 'book' }) {
  if (icon === 'person') {
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="9" r="4" stroke="currentColor" strokeWidth="2.2" />
        <path d="M5.5 22c.9-4.2 3.6-6.3 7.5-6.3s6.6 2.1 7.5 6.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === 'document') {
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M7 3.8h9l3 3v15.4H7V3.8Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M15.8 4v4h4M10 12.2h5.5M10 16.2h4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M5 5.4c2.5-.9 5.1-.6 8 1.1 2.9-1.7 5.5-2 8-1.1v15.2c-2.5-.9-5.1-.6-8 1.1-2.9-1.7-5.5-2-8-1.1V5.4Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M13 6.5v15" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}
