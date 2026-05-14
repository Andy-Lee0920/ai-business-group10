import type { CSSProperties } from 'react';

export const onboardingTokens = {
  primary: '#C4614A',
  activeBg: '#FFF0EB',
  surface: '#FFFCFA',
  card: '#FFFFFF',
  border: '#F0EDE8',
  textMain: '#2A1F1A',
  textMuted: '#9B8E86',
  radiusCard: 16,
  radiusPill: 999,
} as const;

export function RoleButton({ active, icon, title, description, onClick }: { active: boolean; icon?: string; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'block', width: '100%', minHeight: 96, padding: '20px 22px',
      background: active ? onboardingTokens.activeBg : onboardingTokens.card,
      border: `2px solid ${active ? onboardingTokens.primary : onboardingTokens.border}`,
      borderRadius: onboardingTokens.radiusCard, marginBottom: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: active ? '0 14px 30px rgba(196, 97, 74, 0.12)' : 'none',
    }}>
      {icon ? <span style={{ display: 'inline-grid', placeItems: 'center', width: 40, height: 40, marginBottom: 10, borderRadius: onboardingTokens.radiusPill, background: '#FCE9E3', color: onboardingTokens.primary, fontWeight: 900 }}>{icon}</span> : null}
      <span style={{ display: 'block', fontSize: 17, fontWeight: 800, color: onboardingTokens.textMain, marginBottom: 4 }}>{title}</span>
      <span style={{ display: 'block', fontSize: 14, color: onboardingTokens.textMuted, lineHeight: 1.45 }}>{description}</span>
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
  background: '#FFFFFF', border: `1px solid ${onboardingTokens.border}`,
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
  color: '#B54735', background: '#FFF0EB', borderRadius: 14, padding: '10px 12px', fontSize: 13, lineHeight: 1.4,
};

export function ctaStyle(disabled: boolean): CSSProperties {
  return {
    background: onboardingTokens.primary, color: '#fff', border: 'none', borderRadius: onboardingTokens.radiusPill,
    minHeight: 52, padding: '15px 0', fontSize: 16, fontWeight: 800, cursor: disabled ? 'default' : 'pointer',
    width: '100%', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, marginTop: 20,
  };
}
