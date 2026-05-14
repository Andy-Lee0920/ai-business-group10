import type { CSSProperties } from 'react';

export function RoleButton({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'block', width: '100%', padding: '20px 22px',
      background: active ? 'var(--slc-coral-light)' : 'var(--slc-card)',
      border: `2px solid ${active ? 'var(--slc-coral)' : 'var(--slc-border)'}`,
      borderRadius: 22, marginBottom: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: active ? '0 14px 30px rgba(196, 97, 74, 0.12)' : 'none',
    }}>
      <span style={{ display: 'block', fontSize: 17, fontWeight: 800, color: 'var(--slc-text)', marginBottom: 4 }}>{title}</span>
      <span style={{ display: 'block', fontSize: 13, color: 'var(--slc-muted)' }}>{description}</span>
    </button>
  );
}

export const screenStyle: CSSProperties = {
  padding: '64px 24px 28px', minHeight: '100dvh', background: 'var(--slc-bg)', display: 'flex', flexDirection: 'column',
};

export const titleStyle: CSSProperties = {
  fontSize: 26, fontWeight: 900, color: 'var(--slc-text)', margin: '0 0 10px', lineHeight: 1.25,
};

export const leadStyle: CSSProperties = {
  fontSize: 15, color: 'var(--slc-muted)', margin: '0 0 32px', lineHeight: 1.6,
};

export const checkStyle: CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.74)', border: '1px solid var(--slc-border)',
  color: '#6B5E55', fontSize: 13, lineHeight: 1.45,
};

export const inputStyle: CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--slc-border)',
  fontSize: 16, fontFamily: 'inherit', background: 'var(--slc-card)', boxSizing: 'border-box', marginBottom: 16,
};

export const backButtonStyle: CSSProperties = {
  alignSelf: 'flex-start', marginBottom: 24, border: 0, background: 'transparent',
  color: 'var(--slc-muted)', fontWeight: 700, cursor: 'pointer',
};

export const errorStyle: CSSProperties = {
  color: '#B54735', background: '#FFF0EB', borderRadius: 14, padding: '10px 12px', fontSize: 13, lineHeight: 1.4,
};

export function ctaStyle(disabled: boolean): CSSProperties {
  return {
    background: 'var(--slc-coral)', color: '#fff', border: 'none', borderRadius: 999,
    padding: '15px 0', fontSize: 16, fontWeight: 800, cursor: disabled ? 'default' : 'pointer',
    width: '100%', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, marginTop: 20,
  };
}
