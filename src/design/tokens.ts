export const fevioTokens = {
  color: {
    sage: '#6F8F6E',
    lavender: '#B9AED6',
    cream: '#F6F4F1',
    coral: '#E07A68',
    ink: '#20231F',
    muted: '#686F64',
    card: '#FFFFFF',
  },
  radius: {
    card: '22px',
    control: '999px',
    badge: '999px',
  },
  touchTarget: {
    minHeight: '48px',
  },
} as const;

export type FevioTone = 'sage' | 'lavender' | 'coral' | 'neutral';
