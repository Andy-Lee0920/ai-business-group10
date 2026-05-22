import type { ScheduleItem } from '../../types/slc.types';
import { formatKstTime } from '../../domain/kst-date';

export function ExecutionPreview({ item, onOpen }: { item: ScheduleItem | null; onOpen: (item: ScheduleItem) => void }) {
  if (!item) return null;
  return (
    <button type="button" data-testid="execution-preview" onClick={() => onOpen(item)} style={buttonStyle}>
      <span style={labelStyle}>다음 실행</span>
      <strong style={titleStyle}>{formatKstTime(item.scheduled_at)} · {item.title}</strong>
      <span aria-hidden="true" style={arrowStyle}>›</span>
    </button>
  );
}

const buttonStyle = { width: '100%', minHeight: 58, display: 'grid', gridTemplateColumns: '72px 1fr auto', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 20, border: '1px solid var(--slc-border)', background: 'rgba(255,255,255,0.76)', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' } as const;
const labelStyle = { color: 'var(--slc-muted)', fontSize: 12, fontWeight: 900 } as const;
const titleStyle = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--slc-text)', fontSize: 14, fontWeight: 900 } as const;
const arrowStyle = { color: 'var(--slc-coral)', fontSize: 22, lineHeight: 1 } as const;
