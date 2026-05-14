'use client';
import type { ScheduleItem } from '../types/slc.types';
import { computeStatus, ctaLabel, completedLabel } from '../types/slc.types';
import { CountdownRing } from './countdown-ring';

interface ActionCardProps {
  item: ScheduleItem;
  onCta: (item: ScheduleItem) => void;
  compact?: boolean;
  showCountdown?: boolean;
}

export function ActionCard({ item, onCta, compact = false, showCountdown = true }: ActionCardProps) {
  const status = item.status === 'completed' ? 'completed' : computeStatus(item.scheduled_at);
  const isCompleted = status === 'completed';
  const isDueSoon = status === 'due_soon' || status === 'due';
  const timeStr = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const cta = ctaLabel(item.type);
  const completedStr = completedLabel(item.type);

  return (
    <div style={{
      background: isCompleted ? '#F7F5F2' : '#FFFFFF',
      borderRadius: 22,
      padding: compact ? '16px 20px' : '24px 24px',
      boxShadow: isCompleted ? 'none' : '0 4px 24px rgba(80, 50, 40, 0.09)',
      border: isCompleted
        ? '1.5px solid #E8E4DF'
        : isDueSoon
          ? '1.5px solid #E8A898'
          : '1.5px solid transparent',
      position: 'relative',
      opacity: isCompleted ? 0.7 : 1,
      transition: 'all 0.3s ease',
    }}>
      {showCountdown && isDueSoon && !isCompleted && (
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <CountdownRing scheduledAt={item.scheduled_at} size={64} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#9B8E86', fontWeight: 500 }}>{timeStr}</span>
        <span style={{
          fontSize: compact ? 17 : 20,
          fontWeight: 700,
          color: isCompleted ? '#B5A89E' : '#2A1F1A',
          lineHeight: 1.3,
        }}>
          {formatTitle(item)}
        </span>
        {isCompleted ? (
          <span style={{ fontSize: 14, color: '#B5A89E', fontWeight: 500 }}>{completedStr}</span>
        ) : (
          <button
            onClick={() => onCta(item)}
            style={{
              marginTop: 12,
              background: '#C4614A',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '13px 28px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              fontFamily: 'inherit',
            }}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

function formatTitle(item: ScheduleItem) {
  const suffix = item.dose && item.unit ? `${item.dose} ${item.unit}` : '';
  if (!suffix || item.title.includes(suffix)) return item.title;
  return `${item.title} ${suffix}`;
}
