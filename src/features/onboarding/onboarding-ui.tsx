import type { CSSProperties, ReactNode } from 'react';

export const onboardingTokens = {
  primary: 'var(--slc-coral)',
  activeBg: 'var(--slc-coral-light)',
  surface: '#FFFCFA',
  card: 'var(--slc-card)',
  border: 'var(--slc-border)',
  textMain: 'var(--slc-text)',
  textMuted: 'var(--slc-muted)',
  radiusCard: 16,
  radiusPill: 999,
} as const;

type RoleButtonProps = {
  active: boolean;
  illustration?: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

export function RoleButton({ active, illustration, title, description, onClick }: RoleButtonProps) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'grid', justifyItems: 'center', width: '100%', minHeight: 224, padding: '18px 14px 20px',
      background: active ? onboardingTokens.activeBg : onboardingTokens.card,
      border: `2px solid ${active ? onboardingTokens.primary : onboardingTokens.border}`,
      borderRadius: 22, marginBottom: 0, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
      boxShadow: active ? '0 18px 34px rgba(196, 97, 74, 0.14)' : '0 10px 24px rgba(42, 31, 26, 0.04)',
    }}>
      {illustration ? <span style={{ display: 'block', width: '100%', marginBottom: 12 }}>{illustration}</span> : null}
      <span style={{ display: 'block', fontSize: 21, fontWeight: 900, color: active ? onboardingTokens.primary : onboardingTokens.textMain, marginBottom: 6 }}>{title}</span>
      <span style={{ display: 'block', fontSize: 13, color: onboardingTokens.textMuted, lineHeight: 1.45, wordBreak: 'keep-all' }}>{description}</span>
    </button>
  );
}

export const screenStyle: CSSProperties = {
  padding: '64px 24px calc(28px + env(safe-area-inset-bottom))', minHeight: '100dvh', background: onboardingTokens.surface, display: 'flex', flexDirection: 'column', color: onboardingTokens.textMain,
};

export const titleStyle: CSSProperties = {
  fontSize: 26, fontWeight: 900, color: onboardingTokens.textMain, margin: '0 0 10px', lineHeight: 1.25,
};

export const leadStyle: CSSProperties = {
  fontSize: 15, color: onboardingTokens.textMuted, margin: '0 0 32px', lineHeight: 1.6,
};

export const checkStyle: CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44, padding: 14, borderRadius: onboardingTokens.radiusCard,
  background: 'var(--slc-card)', border: `1px solid ${onboardingTokens.border}`,
  color: '#6B5E55', fontSize: 13, lineHeight: 1.45,
};

export const inputStyle: CSSProperties = {
  width: '100%', minHeight: 48, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${onboardingTokens.border}`,
  fontSize: 16, fontFamily: 'inherit', background: onboardingTokens.card, color: onboardingTokens.textMain, boxSizing: 'border-box', marginBottom: 16,
};

export const backButtonStyle: CSSProperties = {
  alignSelf: 'flex-start', minHeight: 44, marginBottom: 24, border: 0, background: 'transparent',
  color: onboardingTokens.textMuted, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

export const errorStyle: CSSProperties = {
  color: '#B54735', background: 'var(--slc-coral-light)', borderRadius: 14, padding: '10px 12px', fontSize: 13, lineHeight: 1.4,
};

export function ctaStyle(disabled: boolean): CSSProperties {
  return {
    background: onboardingTokens.primary, color: '#fff', border: 'none', borderRadius: onboardingTokens.radiusPill,
    minHeight: 52, padding: '15px 0', fontSize: 16, fontWeight: 800, cursor: disabled ? 'default' : 'pointer',
    width: '100%', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, marginTop: 20,
  };
}
