'use client';
import type { CSSProperties } from 'react';
import type { ScheduleItem } from '../types/slc.types';
import { ctaLabel, completedLabel } from '../types/slc.types';
import { getSchedulePresentation, type ScheduleBadgeTone } from '../domain/slc-home-focus';
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
  const timeStr = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const cta = ctaLabel(item.type);
  const completedStr = completedLabel(item.type);
  const title = formatTitle(item);
  const urgent = emphasis === 'primary';

  return (
    <div data-card-emphasis={emphasis} style={cardStyle(emphasis, compact)}>
      {showCountdown && isDueSoon && !isCompleted && (
        <div style={{ position: 'absolute', top: urgent ? 46 : 16, right: urgent ? 22 : 16 }}>
          <CountdownRing scheduledAt={item.scheduled_at} size={urgent ? 76 : 64} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: urgent ? 9 : 6, maxWidth: urgent && showCountdown ? '68%' : '100%' }}>
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
            style={ctaButtonStyle(emphasis)}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

function cardEmphasis({ compact, isCompleted, isDueSoon, isWithinHour }: { compact: boolean; isCompleted: boolean; isDueSoon: boolean; isWithinHour: boolean }): CardEmphasis {
  if (isCompleted) return 'completed';
  if (!compact && isDueSoon) return 'primary';
  if (!compact && isWithinHour) return 'warning';
  return 'secondary';
}

function cardStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  const base: CSSProperties = {
    borderRadius: 24,
    padding: compact ? '16px 20px' : '24px 24px',
    position: 'relative',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
  };

  if (emphasis === 'primary') {
    return {
      ...base,
      minHeight: 210,
      background: 'linear-gradient(135deg, #EF7A5D 0%, #C94C35 100%)',
      border: '1.5px solid rgba(255,255,255,0.32)',
      boxShadow: '0 18px 42px rgba(196, 73, 48, 0.28)',
      color: '#fff',
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
    background: '#FFFFFF',
    border: '1.5px solid #EFE7E0',
    boxShadow: compact ? '0 4px 20px rgba(80, 50, 40, 0.06)' : '0 4px 24px rgba(80, 50, 40, 0.09)',
  };
}

function timeStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  if (emphasis === 'primary') {
    return { fontSize: 31, color: '#fff', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 };
  }
  return { fontSize: compact ? 13 : 14, color: '#9B8E86', fontWeight: 700 };
}

function titleStyle(emphasis: CardEmphasis, compact: boolean): CSSProperties {
  if (emphasis === 'primary') {
    return { fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em' };
  }
  return {
    fontSize: compact ? 17 : 20,
    fontWeight: 800,
    color: emphasis === 'completed' ? '#B5A89E' : '#2A1F1A',
    lineHeight: 1.3,
  };
}

function ctaButtonStyle(emphasis: CardEmphasis): CSSProperties {
  if (emphasis === 'primary') {
    return {
      marginTop: 14,
      background: '#FFFBF8',
      color: '#C94C35',
      border: 'none',
      borderRadius: 999,
      padding: '15px 30px',
      fontSize: 16,
      fontWeight: 900,
      cursor: 'pointer',
      alignSelf: 'stretch',
      fontFamily: 'inherit',
      boxShadow: '0 8px 18px rgba(104, 43, 25, 0.16)',
    };
  }

  return {
    marginTop: 12,
    background: '#C4614A',
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '13px 28px',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    fontFamily: 'inherit',
  };
}

function urgentBadgeLabel(item: ScheduleItem) {
  if (item.type === 'clinic') return '지금 병원 일정이에요';
  if (item.type === 'medication') return '지금 복용 시간이에요';
  return '지금 주사 시간이에요';
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
      padding: '7px 12px',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.58)',
      background: '#FFFBF8',
      color: '#C94C35',
      fontSize: 12,
      fontWeight: 900,
      lineHeight: 1,
    } as const;
  }

  const colors = {
    coral: { background: '#FFF0EB', color: '#C4614A', border: '#E8A898' },
    amber: { background: '#FFF7E8', color: '#A86F10', border: '#E9B75F' },
    completed: { background: '#F7F5F2', color: '#9B8E86', border: '#E8E4DF' },
    default: { background: '#F8F4F0', color: '#9B8E86', border: '#EFE7E0' },
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
