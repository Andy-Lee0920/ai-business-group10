import type { ScheduleItem } from '../../types/slc.types';
import { formatKstTime } from '../../domain/kst-date';

export function ExecutionPreview({ item, onOpen }: { item: ScheduleItem | null; onOpen: (item: ScheduleItem) => void }) {
  if (!item) return null;
  return (
    <button type="button" data-testid="execution-preview" onClick={() => onOpen(item)} style={buttonStyle}>
      <span aria-hidden="true" style={accentBarStyle} />
      <div style={textBlockStyle}>
        <span style={labelStyle}>다음 실행</span>
        <strong style={titleStyle}>{formatKstTime(item.scheduled_at)} · {item.title}</strong>
      </div>
      <span aria-hidden="true" style={arrowStyle}>›</span>
    </button>
  );
}

const buttonStyle = {
  width: '100%',
  minHeight: 60,
  display: 'grid',
  gridTemplateColumns: '4px 1fr auto',
  alignItems: 'center',
  gap: 14,
  padding: '13px 16px 13px 14px',
  borderRadius: 22,
  border: '1px solid var(--slc-border)',
  background: 'rgba(255,255,255,0.82)',
  boxShadow: '0 4px 16px rgba(75, 52, 42, 0.06)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
} as const;

const accentBarStyle = {
  alignSelf: 'stretch',
  width: 4,
  borderRadius: 4,
  background: 'var(--slc-coral-gradient)',
} as const;

const textBlockStyle = {
  display: 'grid',
  gap: 3,
  minWidth: 0,
} as const;

const labelStyle = {
  color: 'var(--slc-muted)',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as const;

const titleStyle = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'var(--slc-text)',
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: '-0.02em',
} as const;

const arrowStyle = {
  color: 'var(--slc-coral)',
  fontSize: 22,
  lineHeight: 1,
} as const;
