'use client';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ScheduleItem } from '../types/slc.types';
import { ctaLabel, completedLabel } from '../types/slc.types';
import { getSchedulePresentation, type ScheduleBadgeTone } from '../domain/slc-home-focus';
import { formatKstTime } from '../domain/kst-date';
import { CountdownRing } from './countdown-ring';

interface ActionCardProps {
  item: ScheduleItem;
  onCta: (item: ScheduleItem) => void;
  compact?: boolean;
  showCountdown?: boolean;
}

type CardEmphasis = 'primary' | 'warning' | 'secondary' | 'completed';

export function ActionCard({ item, onCta, compact = false, showCountdown = true }: ActionCardProps) {
  const presentation = getSchedulePresentation(item);
  const status = presentation.status;
  const isCompleted = status === 'completed';
  const isDueSoon = status === 'due_soon' || status === 'due';
  const isWithinHour = presentation.badgeTone === 'amber';
  const emphasis = cardEmphasis({ compact, isCompleted, isDueSoon, isWithinHour });
  const timeStr = formatKstTime(item.scheduled_at);
  const cta = ctaLabel(item.type);
  const completedStr = completedLabel(item.type);
  const title = formatTitle(item);
  const urgent = emphasis === 'primary';
  const accentStyle: CSSProperties = status === 'missed' ? { borderLeft: '3px solid var(--slc-coral)' } : {};

  return (
    <div data-card-emphasis={emphasis} style={{ ...cardStyle(emphasis, compact), ...accentStyle }}>
      {showCountdown && isDueSoon && !isCompleted && (
        <div style={{ position: 'absolute', top: urgent ? 20 : 16, right: urgent ? 20 : 16 }}>
          <CountdownRing scheduledAt={item.scheduled_at} size={urgent ? 64 : 56} />
        </div>
      )}
      <Link href={`/schedule/${item.id}/edit`} aria-label={`${title} 수정`} style={editLinkStyle}>수정</Link>
      <div style={{ display: 'flex', flexDirection: 'column', gap: urgent ? 7 : 6, paddingRight: urgent && showCountdown ? 78 : 0 }}>
        <span data-testid="schedule-status-badge" data-tone={presentation.badgeTone} style={badgeStyle(presentation.badgeTone, emphasis)}>
          {urgent ? urgentBadgeLabel(item) : presentation.badgeLabel}
        </span>
        <span style={timeStyle(emphasis, compact)}>{timeStr}</span>
        <span style={titleStyle(emphasis, compact)}>{title}</span>
        {isCompleted ? (
          <span style={{ fontSize: 14, color: '#B5A89E', fontWeight: 500 }}>{completedStr}</span>
        ) : (
          <button
            onClick={() => onCta(item)}
            style={ctaButtonStyle(emphasis, compact)}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

const editLinkStyle: CSSProperties = {
  position: 'absolute',
  right: 14,
  bottom: 14,
  zIndex: 2,
  color: 'var(--slc-coral)',
  fontSize: 12,
  fontWeight: 900,
  textDecoration: 'none',
  padding: '6px 9px',
  borderRadius: 999,
  background: 'var(--slc-surface)',
  border: '1px solid var(--slc-border)',
};

function cardEmphasis({ compact, isCompleted, isDueSoon, isWithinHour }: { compact: boolean; isCompleted: boolean; isDueSoon: boolean; isWithinHour: boolean }): CardEmphasis {
  if (isCompleted) return 'completed';
  if (!compact && isDueSoon) return 'primary';
  if (!compact && isWithinHour) return 'warning';
  return 'secondary';
}

function cardStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  const base: CSSProperties = {
    borderRadius: compact ? 20 : 24,
    padding: compact ? '15px 16px' : '22px 20px',
    position: 'relative',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
  };

  if (emphasis === 'primary') {
    return {
      ...base,
      minHeight: 202,
      background: 'var(--slc-card)',
      border: '1.5px solid #E8A898',
      boxShadow: '0 10px 30px rgba(216, 98, 77, 0.13)',
    };
  }

  if (emphasis === 'warning') {
    return {
      ...base,
      background: '#FFF8ED',
      border: '1.5px solid #E9B75F',
      boxShadow: '0 10px 28px rgba(168, 111, 16, 0.13)',
    };
  }

  if (emphasis === 'completed') {
    return {
      ...base,
      background: '#F7F5F2',
      border: '1.5px solid #E8E4DF',
      boxShadow: 'none',
      opacity: 0.7,
    };
  }

  return {
    ...base,
    background: 'var(--slc-card)',
    border: '1.5px solid #EFE7E0',
    boxShadow: compact ? '0 4px 20px rgba(80, 50, 40, 0.06)' : '0 4px 24px rgba(80, 50, 40, 0.09)',
  };
}

function timeStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  if (emphasis === 'primary') {
    return { fontSize: 17, color: 'var(--slc-text)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 };
  }
  return { fontSize: compact ? 13 : 14, color: 'var(--slc-muted)', fontWeight: 700 };
}

function titleStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  if (emphasis === 'primary') {
    return { fontSize: 24, fontWeight: 900, color: 'var(--slc-text)', lineHeight: 1.22, letterSpacing: '-0.04em' };
  }
  return {
    fontSize: compact ? 17 : 20,
    fontWeight: 900,
    color: emphasis === 'completed' ? '#B5A89E' : 'var(--slc-text)',
    lineHeight: 1.3,
    letterSpacing: '-0.03em',
  };
}

function ctaButtonStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  if (emphasis === 'primary') {
    return {
      marginTop: 14,
      background: 'var(--slc-coral-gradient)',
      color: '#fff',
      border: 'none',
      borderRadius: 999,
      minHeight: 52,
      width: '100%',
      padding: '13px 28px',
      fontSize: 15,
      fontWeight: 900,
      cursor: 'pointer',
      alignSelf: 'stretch',
      fontFamily: 'inherit',
    };
  }

  return {
    marginTop: compact ? 8 : 12,
    background: 'var(--slc-coral-gradient)',
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: compact ? '11px 20px' : '13px 28px',
    fontSize: 15,
    fontWeight: 900,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    fontFamily: 'inherit',
  };
}

function urgentBadgeLabel(item: ScheduleItem) {
  if (item.type === 'clinic') return '병원';
  if (item.type === 'medication') return '복용';
  return '주사';
}

function formatTitle(item: ScheduleItem) {
  const suffix = item.dose && item.unit ? `${item.dose} ${item.unit}` : '';
  if (!suffix || item.title.includes(suffix)) return item.title;
  return `${item.title} ${suffix}`;
}

function badgeStyle(tone: ScheduleBadgeTone, emphasis: CardEmphasis) {
  if (emphasis === 'primary') {
    return {
      alignSelf: 'flex-start',
      padding: '5px 10px',
      borderRadius: 999,
      border: '1px solid #E8A898',
      background: 'var(--slc-coral-light)',
      color: 'var(--slc-coral)',
      fontSize: 12,
      fontWeight: 900,
      lineHeight: 1,
    } as const;
  }

  const colors = {
    coral: { background: 'var(--slc-coral-light)', color: 'var(--slc-coral)', border: '#E8A898' },
    amber: { background: '#FFF7E8', color: '#A86F10', border: '#E9B75F' },
    completed: { background: '#F7F5F2', color: 'var(--slc-muted)', border: '#E8E4DF' },
    default: { background: '#F8F4F0', color: 'var(--slc-muted)', border: '#EFE7E0' },
  }[tone];

  return {
    alignSelf: 'flex-start',
    padding: '4px 9px',
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: colors.background,
    color: colors.color,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1,
  } as const;
}
