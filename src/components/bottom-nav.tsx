'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, FileText, House, Plus, Settings } from 'lucide-react';
import type { CSSProperties } from 'react';

type NavIconName = 'care' | 'calendar' | 'plus' | 'timeline' | 'gear';

type NavLinkItem = {
  readonly kind: 'link';
  readonly href: string;
  readonly label: string;
  readonly icon: NavIconName;
  readonly placement: 'side' | 'center';
};

export const NAV_ITEMS = [
  { kind: 'link', href: '/home', label: '홈', icon: 'care', placement: 'side' },
  { kind: 'link', href: '/calendar', label: '캘린더', icon: 'calendar', placement: 'side' },
  { kind: 'link', href: '/care-agent', label: '+', icon: 'plus', placement: 'center' },
  { kind: 'link', href: '/records', label: '기록', icon: 'timeline', placement: 'side' },
  { kind: 'link', href: '/settings', label: '설정', icon: 'gear', placement: 'side' },
] as const satisfies readonly NavLinkItem[];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fevio-bottom-nav" aria-label="하단 주요 메뉴" style={navStyle}>
      {NAV_ITEMS.map((item) => {
        const center = item.placement === 'center';
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-label={center ? '케어 에이전트 열기' : undefined}
            data-testid={center ? 'bottom-nav-create-button' : undefined}
            style={itemStyle(active, center)}
          >
            <span style={iconShellStyle(active, center)}>
              <NavIcon name={item.icon} />
            </span>
            {center ? null : <span style={labelStyle}>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  if (name === 'care') {
    return <House aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />;
  }

  if (name === 'calendar') {
    return <CalendarDays aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />;
  }

  if (name === 'plus') {
    return <Plus aria-hidden="true" focusable="false" size={22} strokeWidth={2.05} />;
  }

  if (name === 'timeline') {
    return <FileText aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />;
  }

  return <Settings aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />;
}

const navStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 'var(--fevio-mobile-frame-max)',
  background: 'rgba(255, 252, 247, 0.88)',
  borderTop: '1px solid rgba(224, 216, 207, 0.7)',
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 2,
  padding: '8px 10px max(12px, env(safe-area-inset-bottom))',
  minHeight: 'var(--fevio-bottom-nav-height)',
  boxShadow: '0 -16px 38px rgba(47, 41, 38, 0.08)',
  backdropFilter: 'blur(18px) saturate(1.08)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.08)',
  zIndex: 50,
};

function itemStyle(active: boolean, center: boolean): CSSProperties {
  return {
    minHeight: 56,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    color: active ? 'var(--slc-coral)' : center ? 'var(--slc-coral)' : '#8F8179',
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: active ? 900 : 700,
    borderRadius: 18,
    transform: 'none',
    transition: 'background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
  };
}

function iconShellStyle(active: boolean, center: boolean): CSSProperties {
  if (center) {
    return {
      width: 38,
      height: 38,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 999,
      background: 'linear-gradient(180deg, #E96857 0%, #D25B4C 100%)',
      color: '#fff',
      boxShadow: '0 12px 24px rgba(216, 98, 77, 0.28)',
      transform: 'translateY(-2px)',
    };
  }

  return {
    width: 34,
    height: 30,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 14,
    background: active ? 'rgba(232, 108, 86, 0.12)' : 'transparent',
    color: active ? 'var(--slc-coral)' : '#8F8179',
    transform: 'none',
  };
}

const labelStyle: CSSProperties = {
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
};
