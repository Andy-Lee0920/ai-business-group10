'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { CSSProperties } from 'react';

type NavIconName = 'care' | 'timeline' | 'manage';

export const NAV_ITEMS = [
  { href: '/records', label: '기록', icon: 'timeline', placement: 'side' },
  { href: '/home', label: '홈', icon: 'care', placement: 'center' },
  { href: '/more', label: '관리', icon: 'manage', placement: 'side' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="하단 주요 메뉴" style={navStyle}>
      {NAV_ITEMS.map(({ href, label, icon, placement }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const center = placement === 'center';
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            style={itemStyle(active, center)}
          >
            <span style={iconShellStyle(active, center)}>
              <NavIcon name={icon} />
            </span>
            <span style={labelStyle}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  if (name === 'care') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.75v2.1M12 18.15v2.1M5.85 12H3.75M20.25 12h-2.1" />
        <path d="m7.65 7.65-1.5-1.5M17.85 17.85l-1.5-1.5M16.35 7.65l1.5-1.5M6.15 17.85l1.5-1.5" />
        <circle cx="12" cy="12" r="4.35" />
        <path d="m10.25 12.05 1.12 1.12 2.38-2.54" />
      </svg>
    );
  }

  if (name === 'timeline') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.25 5.5h9.5a1.75 1.75 0 0 1 1.75 1.75v9.5a1.75 1.75 0 0 1-1.75 1.75h-9.5a1.75 1.75 0 0 1-1.75-1.75v-9.5A1.75 1.75 0 0 1 7.25 5.5Z" />
        <path d="M8.75 9.25h6.5M8.75 12h5.25M8.75 14.75h3.25" />
        <path d="M15.5 14.9c.55.2.95.62 1.13 1.15" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 7.25h13M5.5 16.75h13" />
      <circle cx="9" cy="7.25" r="2" />
      <circle cx="15" cy="16.75" r="2" />
      <path d="M12 12h6.5M5.5 12H8" />
      <circle cx="10" cy="12" r="2" />
    </svg>
  );
}

const navStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 430,
  background: 'linear-gradient(180deg, rgba(255, 252, 250, 0.82) 0%, rgba(255, 252, 250, 0.98) 34%)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  borderTop: '1px solid rgba(232, 224, 216, 0.9)',
  boxShadow: '0 -18px 40px rgba(92, 68, 54, 0.08)',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 6,
  padding: '10px 12px max(16px, env(safe-area-inset-bottom))',
  zIndex: 50,
};

function itemStyle(active: boolean, center: boolean): CSSProperties {
  return {
    minHeight: center ? 64 : 58,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    color: active || center ? '#8D4A39' : '#9C9087',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: active || center ? 800 : 650,
    borderRadius: center ? 24 : 22,
    background: center
      ? 'linear-gradient(180deg, rgba(255, 240, 235, 0.98) 0%, rgba(255, 252, 250, 0.98) 100%)'
      : active ? 'rgba(196, 97, 74, 0.11)' : 'rgba(255, 255, 255, 0.42)',
    border: active || center ? '1px solid rgba(196, 97, 74, 0.18)' : '1px solid rgba(240, 237, 232, 0.72)',
    boxShadow: center ? '0 10px 26px rgba(196, 97, 74, 0.14)' : undefined,
    transform: center ? 'translateY(-6px)' : 'none',
    transition: 'background 160ms ease, color 160ms ease, transform 160ms ease',
  };
}

function iconShellStyle(active: boolean, center: boolean): CSSProperties {
  return {
    width: center ? 34 : 30,
    height: center ? 28 : 26,
    display: 'grid',
    placeItems: 'center',
    color: active || center ? 'var(--slc-coral)' : '#A99D94',
    transform: active ? 'translateY(-1px)' : 'none',
  };
}

const labelStyle: CSSProperties = {
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
};
