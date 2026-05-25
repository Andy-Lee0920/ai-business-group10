'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, FileText, Hospital, House, Plus, Settings, Syringe } from 'lucide-react';
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
            <h2 style={sheetTitleStyle}>무엇을 남길까요?</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <Link href="/add" onClick={closeCreateSheet} style={sheetOptionStyle}>
                <span style={sheetOptionIconStyle}><Syringe size={21} strokeWidth={1.9} /></span>
                <span>
                  <strong style={sheetOptionTitleStyle}>주사·복약 남기기</strong>
                  <small style={sheetOptionDescriptionStyle}>맞았거나 먹은 시간을 확인하고 저장해요</small>
                </span>
                <span aria-hidden="true" style={sheetChevronStyle}>›</span>
              </Link>
              <Link href="/clinic-update" onClick={closeCreateSheet} style={sheetOptionStyle}>
                <span style={sheetOptionIconStyle}><Hospital size={21} strokeWidth={1.9} /></span>
                <span>
                  <strong style={sheetOptionTitleStyle}>병원 방문 남기기</strong>
                  <small style={sheetOptionDescriptionStyle}>다녀온 안내를 다음 일정과 메모로 정리해요</small>
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

const buttonResetStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 0,
  appearance: 'none',
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
  background: 'rgba(42, 31, 26, 0.12)',
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
  padding: '12px 18px max(24px, env(safe-area-inset-bottom))',
  background: 'rgba(255, 252, 247, 0.96)',
  border: '1px solid rgba(224, 216, 207, 0.82)',
  borderBottom: 'none',
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  boxShadow: '0 -22px 54px rgba(42, 31, 26, 0.14)',
  backdropFilter: 'blur(20px) saturate(1.08)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.08)',
};

const sheetHandleStyle: CSSProperties = {
  width: 42,
  height: 5,
  borderRadius: 999,
  background: 'rgba(183, 170, 160, 0.38)',
  margin: '0 auto 16px',
};

const sheetTitleStyle: CSSProperties = {
  margin: '0 0 16px',
  color: 'var(--slc-text)',
  fontSize: 19,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const sheetOptionStyle: CSSProperties = {
  minHeight: 72,
  display: 'grid',
  gridTemplateColumns: '44px 1fr auto',
  alignItems: 'center',
  gap: 12,
  padding: '13px 14px',
  borderRadius: 22,
  background: 'rgba(255, 255, 255, 0.74)',
  border: '1px solid rgba(224, 216, 207, 0.82)',
  color: 'var(--slc-text)',
  textDecoration: 'none',
  boxShadow: '0 10px 24px rgba(47, 41, 38, 0.04)',
};

const sheetOptionIconStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 18,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(180deg, #FFF6F0 0%, #F8ECE5 100%)',
  color: '#55756A',
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
