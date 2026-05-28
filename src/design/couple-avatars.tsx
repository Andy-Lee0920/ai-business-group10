import type { SVGProps } from 'react';

export type CoupleAvatarTone = 'sage' | 'lavender' | 'coral' | 'cream';

export type CoupleAvatarProps = Omit<SVGProps<SVGSVGElement>, 'role'> & {
  'data-testid'?: string;
  label?: string;
  size?: number;
  tone?: CoupleAvatarTone;
};

const VIEW_BOX = '0 0 64 64';
const DEFAULT_SIZE = 44;
const TONES: Record<CoupleAvatarTone, { bg: string; halo: string; ink: string; accent: string; soft: string }> = {
  sage: { bg: '#F2F8EF', halo: '#DCEBDB', ink: '#31452F', accent: '#6F8F6E', soft: '#FFFFFF' },
  lavender: { bg: '#F4F0FF', halo: '#DDD8F1', ink: '#3B3452', accent: '#8D80B8', soft: '#FFFFFF' },
  coral: { bg: '#FFF3EC', halo: '#FFD1BD', ink: '#5A3028', accent: '#E07A68', soft: '#FFFFFF' },
  cream: { bg: '#FBFAF7', halo: '#ECE8DE', ink: '#34352F', accent: '#B9AED6', soft: '#FFFFFF' },
};

function accessibility(label: string | undefined) {
  if (label) return { role: 'img' as const, 'aria-label': label };
  return { 'aria-hidden': true as const, focusable: false as const };
}

function baseSvgProps({ label, size = DEFAULT_SIZE, className, ...rest }: CoupleAvatarProps) {
  return {
    ...rest,
    ...accessibility(label),
    className,
    width: size,
    height: size,
    viewBox: VIEW_BOX,
  };
}

export function PrimaryUserAvatar(props: CoupleAvatarProps) {
  const tone = props.tone ?? 'sage';
  const palette = TONES[tone];

  return (
    <svg {...baseSvgProps(props)} data-avatar-role="primary" data-testid={props['data-testid'] ?? 'primary-user-avatar'}>
      <circle cx="32" cy="32" r="30" fill={palette.bg} />
      <circle cx="32" cy="32" r="25" fill={palette.soft} opacity="0.72" />
      <circle cx="32" cy="25" r="9" fill={palette.ink} opacity="0.92" />
      <ellipse cx="32" cy="45" rx="16" ry="10" fill={palette.ink} opacity="0.9" />
      <ellipse cx="26" cy="24" rx="10" ry="12" fill={palette.halo} opacity="0.84" />
      <ellipse cx="38" cy="24" rx="10" ry="12" fill={palette.halo} opacity="0.74" />
      <circle cx="32" cy="25" r="7" fill={palette.soft} />
      <circle cx="29" cy="24" r="1.4" fill={palette.ink} />
      <circle cx="35" cy="24" r="1.4" fill={palette.ink} />
      <line x1="29" y1="30" x2="35" y2="30" stroke={palette.accent} strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function PartnerAvatar(props: CoupleAvatarProps) {
  const tone = props.tone ?? 'lavender';
  const palette = TONES[tone];

  return (
    <svg {...baseSvgProps(props)} data-avatar-role="partner" data-testid={props['data-testid'] ?? 'partner-avatar'}>
      <circle cx="32" cy="32" r="30" fill={palette.bg} />
      <rect x="9" y="9" width="46" height="46" rx="23" fill={palette.soft} opacity="0.72" />
      <circle cx="32" cy="24" r="9" fill={palette.ink} opacity="0.92" />
      <rect x="17" y="38" width="30" height="16" rx="8" fill={palette.ink} opacity="0.9" />
      <rect x="22" y="14" width="20" height="12" rx="6" fill={palette.halo} opacity="0.86" />
      <circle cx="32" cy="25" r="7" fill={palette.soft} />
      <circle cx="29" cy="24" r="1.4" fill={palette.ink} />
      <circle cx="35" cy="24" r="1.4" fill={palette.ink} />
      <line x1="29" y1="30" x2="35" y2="30" stroke={palette.accent} strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function CoupleAvatarPair({ label, size = 64, tone = 'cream', className, ...rest }: CoupleAvatarProps) {
  const palette = TONES[tone];

  return (
    <svg
      {...rest}
      {...accessibility(label)}
      className={className}
      data-avatar-role="together"
      data-testid={rest['data-testid'] ?? 'couple-avatar-pair'}
      height={size}
      viewBox={VIEW_BOX}
      width={size}
    >
      <circle cx="32" cy="32" r="30" fill={palette.bg} />
      <ellipse cx="24" cy="35" rx="16" ry="21" fill="#FFFFFF" opacity="0.74" />
      <ellipse cx="41" cy="34" rx="15" ry="20" fill="#FFFFFF" opacity="0.64" />
      <circle cx="24" cy="24" r="7" fill="#31452F" opacity="0.94" />
      <circle cx="41" cy="25" r="7" fill="#3B3452" opacity="0.92" />
      <ellipse cx="24" cy="44" rx="12" ry="8" fill="#31452F" opacity="0.88" />
      <rect x="31" y="38" width="20" height="14" rx="7" fill="#3B3452" opacity="0.86" />
      <line x1="29" y1="35" x2="36" y2="35" stroke={palette.accent} strokeLinecap="round" strokeWidth="2.2" />
      <circle cx="32" cy="35" r="2.6" fill={palette.accent} />
    </svg>
  );
}

export const COUPLE_AVATAR_VIEWBOX = VIEW_BOX;
