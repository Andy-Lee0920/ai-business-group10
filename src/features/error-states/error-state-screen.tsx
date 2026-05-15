'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets, type SLCAsset } from '../../design/slc-assets';

type ErrorStateVariant = 'offline' | 'syncFailed';

type ErrorStateContent = {
  eyebrow: string;
  title: string;
  description: string;
  asset: SLCAsset;
  retryLabel: string;
  secondaryLabel?: string;
};

const ERROR_STATES: Record<ErrorStateVariant, ErrorStateContent> = {
  offline: {
    eyebrow: 'OFFLINE',
    title: '인터넷 연결을 확인해주세요',
    description: '오프라인 상태예요. 다시 연결되면 오늘 일정과 기록을 이어서 확인할 수 있어요.',
    asset: slcAssets.error.offline,
    retryLabel: '다시 시도',
  },
  syncFailed: {
    eyebrow: 'SYNC',
    title: '동기화에 실패했습니다',
    description: '동기화에 실패했습니다. 잠시 후 다시 시도해주세요.',
    asset: slcAssets.error.syncFailed,
    retryLabel: '다시 시도',
    secondaryLabel: '홈으로',
  },
};

export function ErrorStateScreen({ variant }: { variant: ErrorStateVariant }) {
  const state = ERROR_STATES[variant];
  const retry = () => {
    if (typeof window === 'undefined') return;
    if (variant === 'offline' && window.navigator.onLine && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.reload();
  };

  return (
    <main data-testid={`${variant}-error-screen`} style={shellStyle}>
      <section aria-labelledby={`${variant}-error-title`} style={cardStyle}>
        <SLCIllustration asset={state.asset} size="empty" priority style={illustrationStyle} />
        <p style={eyebrowStyle}>{state.eyebrow}</p>
        <h1 id={`${variant}-error-title`} style={titleStyle}>{state.title}</h1>
        <p style={descriptionStyle}>{state.description}</p>
        <div style={ctaRowStyle}>
          <button type="button" onClick={retry} style={ctaStyle}>{state.retryLabel}</button>
          {state.secondaryLabel ? <Link href="/home" style={secondaryCtaStyle}>{state.secondaryLabel}</Link> : null}
        </div>
      </section>
    </main>
  );
}

const shellStyle: CSSProperties = {
  minHeight: '100dvh',
  padding: '24px',
  background: 'var(--slc-bg)',
  boxSizing: 'border-box',
  color: 'var(--slc-text)',
};

const cardStyle: CSSProperties = {
  minHeight: 'calc(100dvh - 48px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
};

const eyebrowStyle: CSSProperties = {
  margin: '0 0 8px',
  color: 'var(--slc-coral)',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.08em',
};

const titleStyle: CSSProperties = {
  margin: '0 0 10px',
  color: 'var(--slc-text)',
  fontSize: 26,
  lineHeight: 1.22,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  margin: '0 auto',
  maxWidth: 300,
  color: 'var(--slc-muted)',
  fontSize: 14,
  lineHeight: 1.6,
};

const ctaRowStyle: CSSProperties = {
  marginTop: 28,
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 20px',
  borderRadius: 999,
  background: 'var(--slc-coral)',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 900,
  textDecoration: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const secondaryCtaStyle: CSSProperties = {
  ...ctaStyle,
  background: '#fff',
  color: 'var(--slc-coral)',
  border: '1px solid var(--slc-border)',
};

const illustrationStyle: CSSProperties = {
  width: 'min(68%, 220px)',
  marginBottom: 20,
};
