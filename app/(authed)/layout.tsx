import Link from 'next/link';
import { headers } from 'next/headers';
import type { CSSProperties } from 'react';
import { isPresentationHost, isPresentationMode } from '../../src/config';

const tabStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--fevio-muted)',
  padding: '8px 24px',
  minHeight: 48,
  textDecoration: 'none',
};

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));

  return (
    <>
      <div style={{ paddingBottom: 72 }}>{children}</div>
      <nav
        aria-label="주 탐색"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(100%, 460px)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          background: 'var(--fevio-card)',
          borderTop: '1px solid rgba(32,35,31,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <Link href="/home" style={tabStyle} aria-label="오늘 홈">
          오늘
        </Link>
        <Link href="/capture" style={tabStyle} aria-label="병원 기록">
          기록
        </Link>
        <Link href={presentationMode ? '/partner/demo' : '/settings/sharing'} style={tabStyle} aria-label="파트너 보기">
          파트너
        </Link>
      </nav>
    </>
  );
}
