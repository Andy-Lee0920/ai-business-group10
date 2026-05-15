'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type NavIconName = 'care' | 'calendar' | 'plus' | 'timeline' | 'gear';

type NavLinkItem = {
  readonly kind: 'link';
  readonly href: string;
  readonly label: string;
  readonly icon: Exclude<NavIconName, 'plus'>;
  readonly placement: 'side' | 'center';
};

type NavActionItem = {
  readonly kind: 'action';
  readonly label: string;
  readonly icon: 'plus';
  readonly placement: 'center';
  readonly action: 'open-create-sheet';
};

export const NAV_ITEMS = [
  { kind: 'link', href: '/home', label: '홈', icon: 'care', placement: 'side' },
  { kind: 'link', href: '/calendar', label: '캘린더', icon: 'calendar', placement: 'side' },
  { kind: 'action', label: '+', icon: 'plus', placement: 'center', action: 'open-create-sheet' },
  { kind: 'link', href: '/records', label: '기록', icon: 'timeline', placement: 'side' },
  { kind: 'link', href: '/settings', label: '설정', icon: 'gear', placement: 'side' },
] as const satisfies readonly (NavLinkItem | NavActionItem)[];

export function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const closeCreateSheet = () => setCreateOpen(false);
  const openCreateSheet = () => setCreateOpen(true);
  const handleTouchEnd = (clientY: number) => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    if (startY !== null && clientY - startY > 36) closeCreateSheet();
  };

  return (
    <>
      <nav className="fevio-bottom-nav" aria-label="하단 주요 메뉴" style={navStyle}>
        {NAV_ITEMS.map((item) => {
          const center = item.placement === 'center';
          if (item.kind === 'action') {
            return (
              <button
                key={item.action}
                type="button"
                aria-expanded={createOpen}
                aria-haspopup="dialog"
                aria-label="추가 메뉴 열기"
                data-testid="bottom-nav-create-button"
                onClick={openCreateSheet}
                style={{ ...itemStyle(false, center), ...buttonResetStyle }}
              >
                <span style={iconShellStyle(false, center)}>
                  <NavIcon name={item.icon} />
                </span>
                <span style={labelStyle}>{item.label}</span>
              </button>
            );
          }

          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              style={itemStyle(active, center)}
            >
              <span style={iconShellStyle(active, center)}>
                <NavIcon name={item.icon} />
              </span>
              <span style={labelStyle}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {createOpen ? (
        <div
          className="fevio-bottom-sheet-layer"
          aria-label="추가 메뉴"
          aria-modal="true"
          role="dialog"
          style={sheetLayerStyle}
        >
          <button type="button" aria-label="추가 메뉴 닫기" onClick={closeCreateSheet} style={sheetOverlayStyle} />
          <section
            data-testid="create-bottom-sheet"
            style={sheetStyle}
            onTouchStart={(event) => {
              touchStartY.current = event.touches[0]?.clientY ?? null;
            }}
            onTouchEnd={(event) => {
              handleTouchEnd(event.changedTouches[0]?.clientY ?? 0);
            }}
          >
            <div aria-hidden="true" style={sheetHandleStyle} />
            <h2 style={sheetTitleStyle}>무엇을 추가할까요?</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <Link href="/add" onClick={closeCreateSheet} style={sheetOptionStyle}>
                <span style={sheetOptionIconStyle}>📅</span>
                <span>
                  <strong style={sheetOptionTitleStyle}>일정 추가</strong>
                  <small style={sheetOptionDescriptionStyle}>주사·복약·방문 일정을 확인하고 저장해요</small>
                </span>
                <span aria-hidden="true" style={sheetChevronStyle}>›</span>
              </Link>
              <Link href="/clinic-update" onClick={closeCreateSheet} style={sheetOptionStyle}>
                <span style={sheetOptionIconStyle}>📋</span>
                <span>
                  <strong style={sheetOptionTitleStyle}>병원 메모</strong>
                  <small style={sheetOptionDescriptionStyle}>병원 안내를 일정 후보와 메모로 정리해요</small>
                </span>
                <span aria-hidden="true" style={sheetChevronStyle}>›</span>
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  if (name === 'care') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.75 11.25 12 5l7.25 6.25" />
        <path d="M6.75 10.2v7.55A1.75 1.75 0 0 0 8.5 19.5h7a1.75 1.75 0 0 0 1.75-1.75V10.2" />
        <path d="M10 19.5v-4.75a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.75" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.25 4.75v2.5M16.75 4.75v2.5" />
        <path d="M5.75 6.25h12.5A1.75 1.75 0 0 1 20 8v9.25A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25V8a1.75 1.75 0 0 1 1.75-1.75Z" />
        <path d="M4 10h16M8 13.25h.01M12 13.25h.01M16 13.25h.01M8 16h.01M12 16h.01" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5.75v12.5M5.75 12h12.5" />
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
      <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
      <path d="M19.25 12a7.3 7.3 0 0 0-.08-1.04l1.58-1.23-1.5-2.6-1.87.76a7.22 7.22 0 0 0-1.8-1.04l-.28-2.02h-3l-.28 2.02a7.22 7.22 0 0 0-1.8 1.04l-1.87-.76-1.5 2.6 1.58 1.23a7.3 7.3 0 0 0 0 2.08l-1.58 1.23 1.5 2.6 1.87-.76a7.22 7.22 0 0 0 1.8 1.04l.28 2.02h3l.28-2.02a7.22 7.22 0 0 0 1.8-1.04l1.87.76 1.5-2.6-1.58-1.23c.05-.34.08-.68.08-1.04Z" />
    </svg>
  );
}

const navStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 'var(--fevio-mobile-frame-max)',
  background: 'var(--slc-bg)',
  borderTop: '1px solid #E0D8CF',
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 4,
  padding: '8px 8px max(12px, env(safe-area-inset-bottom))',
  minHeight: 'var(--fevio-bottom-nav-height)',
  boxShadow: '0 -10px 26px rgba(47, 41, 38, 0.04)',
  zIndex: 50,
};

function itemStyle(active: boolean, center: boolean): CSSProperties {
  return {
    minHeight: 56,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    color: active || center ? 'var(--slc-coral)' : 'var(--slc-muted)',
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: active ? 800 : 650,
    borderRadius: 22,
    transform: 'none',
    transition: 'background 160ms ease, color 160ms ease, transform 160ms ease',
  };
}

function iconShellStyle(active: boolean, center: boolean): CSSProperties {
  return {
    width: 30,
    height: 26,
    display: 'grid',
    placeItems: 'center',
    color: active || center ? 'var(--slc-coral)' : 'var(--slc-muted)',
    transform: active ? 'translateY(-1px)' : 'none',
  };
}

const buttonResetStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 0,
};

const labelStyle: CSSProperties = {
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
};

const sheetLayerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
};

const sheetOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  border: 'none',
  background: 'rgba(42, 31, 26, 0.18)',
  padding: 0,
  cursor: 'pointer',
};

const sheetStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 0,
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 'var(--fevio-mobile-frame-max)',
  padding: '10px 18px max(22px, env(safe-area-inset-bottom))',
  background: 'var(--slc-surface)',
  border: '1px solid var(--slc-border)',
  borderBottom: 'none',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  boxShadow: '0 -18px 48px rgba(42, 31, 26, 0.12)',
};

const sheetHandleStyle: CSSProperties = {
  width: 42,
  height: 4,
  borderRadius: 999,
  background: 'var(--slc-border)',
  margin: '2px auto 14px',
};

const sheetTitleStyle: CSSProperties = {
  margin: '0 0 14px',
  color: 'var(--slc-text)',
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const sheetOptionStyle: CSSProperties = {
  minHeight: 68,
  display: 'grid',
  gridTemplateColumns: '42px 1fr auto',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 18,
  background: 'var(--slc-bg)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-text)',
  textDecoration: 'none',
};

const sheetOptionIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  background: 'var(--slc-surface)',
};

const sheetOptionTitleStyle: CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: '-0.02em',
};

const sheetOptionDescriptionStyle: CSSProperties = {
  display: 'block',
  marginTop: 3,
  color: 'var(--slc-muted)',
  fontSize: 12,
  lineHeight: 1.35,
};

const sheetChevronStyle: CSSProperties = {
  color: 'var(--slc-coral)',
  fontSize: 24,
  lineHeight: 1,
};
