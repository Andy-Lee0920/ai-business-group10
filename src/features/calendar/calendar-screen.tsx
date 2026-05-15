'use client';
import { useMemo, useState } from 'react';
import type { ScheduleItem } from '../../types/slc.types';

interface CalendarScreenProps {
  readonly items: ScheduleItem[];
  readonly initialDate?: string;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function CalendarScreen({ items, initialDate }: CalendarScreenProps) {
  const today = useMemo(() => initialDate ? new Date(initialDate) : new Date(), [initialDate]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(today));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
  const cells = useMemo(() => buildMonthCells(monthStart), [monthStart]);
  const itemsByDate = useMemo(() => groupItemsByDate(items), [items]);
  const selectedItems = itemsByDate.get(selectedDateKey) ?? [];

  return (
    <div style={{ minHeight: '100dvh', padding: '54px 0 112px', background: 'var(--slc-bg)' }}>
      <header style={{ padding: '0 24px 18px' }}>
        <p style={{ fontSize: 13, color: 'var(--slc-muted)', fontWeight: 700, margin: '0 0 4px' }}>캘린더</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--slc-text)', margin: '0 0 8px', letterSpacing: '-0.05em' }}>{monthLabel}</h1>
        <p style={{ fontSize: 13, color: 'var(--slc-muted)', lineHeight: 1.45, margin: 0 }}>확인된 케어 일정을 날짜별로 볼 수 있어요.</p>
      </header>

      <section aria-label="월 달력" style={calendarCardStyle}>
        <div style={weekdayGridStyle}>
          {WEEKDAY_LABELS.map((label) => <span key={label} style={weekdayStyle}>{label}</span>)}
        </div>
        <div style={monthGridStyle}>
          {cells.map((cell) => {
            const key = toDateKey(cell.date);
            const selected = key === selectedDateKey;
            const inMonth = cell.date.getMonth() === today.getMonth();
            const hasCare = (itemsByDate.get(key)?.length ?? 0) > 0;
            return (
              <button
                key={key}
                type="button"
                aria-label={`${cell.date.getDate()}일${hasCare ? ' 케어 있음' : ''}`}
                onClick={() => setSelectedDateKey(key)}
                style={dateCellStyle(selected, inMonth)}
              >
                <span>{cell.date.getDate()}</span>
                {hasCare ? <span data-testid="calendar-care-dot" style={careDotStyle} /> : <span style={{ height: 5 }} />}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="선택 날짜 케어 타임라인" style={{ padding: '0 16px' }}>
        <h2 style={sectionHeadingStyle}>{formatSelectedDate(selectedDateKey)}</h2>
        {selectedItems.length ? (
          <div data-testid="calendar-care-timeline" style={{ display: 'grid', gap: 8 }}>
            {selectedItems.map((item) => <TimelineCard key={item.id} item={item} />)}
          </div>
        ) : (
          <p style={emptyStateStyle}>이 날은 예정된 케어가 없습니다</p>
        )}
      </section>
    </div>
  );
}

function TimelineCard({ item }: { item: ScheduleItem }) {
  return (
    <article style={timelineCardStyle}>
      <span style={timeStyle}>{formatTime(item.scheduled_at)}</span>
      <span style={{ minWidth: 0 }}>
        <strong style={titleStyle}>{formatTitle(item)}</strong>
        <small style={metaStyle}>{typeLabel(item.type)} · {statusLabel(item.status)}</small>
      </span>
    </article>
  );
}

function buildMonthCells(monthStart: Date) {
  const first = new Date(monthStart);
  first.setDate(1 - first.getDay());
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const totalCells = Math.ceil((monthEnd.getDate() + monthStart.getDay()) / 7) * 7;
  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return { date };
  });
}

function groupItemsByDate(items: ScheduleItem[]) {
  const map = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const key = toDateKey(new Date(item.scheduled_at));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list.sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()));
  }
  return map;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatTitle(item: ScheduleItem) {
  const dose = item.dose && item.unit ? `${item.dose} ${item.unit}` : '';
  return dose && !item.title.includes(dose) ? `${item.title} ${dose}` : item.title;
}

function typeLabel(type: ScheduleItem['type']) {
  if (type === 'clinic') return '병원 방문';
  if (type === 'medication') return '복용';
  return '주사';
}

function statusLabel(status: ScheduleItem['status']) {
  if (status === 'completed') return '완료';
  if (status === 'missed') return '놓침';
  return '예정';
}

const calendarCardStyle = {
  margin: '0 16px 18px',
  padding: '16px 14px 18px',
  borderRadius: 24,
  background: 'var(--slc-surface)',
  border: '1px solid var(--slc-border)',
} as const;

const weekdayGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 4,
  marginBottom: 8,
} as const;

const weekdayStyle = {
  textAlign: 'center',
  color: 'var(--slc-muted)',
  fontSize: 12,
  fontWeight: 800,
} as const;

const monthGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 4,
} as const;

function dateCellStyle(selected: boolean, inMonth: boolean) {
  return {
    minHeight: 46,
    borderRadius: 16,
    border: selected ? '1.5px solid var(--slc-coral)' : '1px solid transparent',
    background: selected ? 'var(--slc-bg)' : 'transparent',
    color: inMonth ? 'var(--slc-text)' : 'var(--slc-muted)',
    opacity: inMonth ? 1 : 0.38,
    display: 'grid',
    placeItems: 'center',
    gap: 3,
    fontSize: 13,
    fontWeight: selected ? 900 : 750,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
}

const careDotStyle = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: 'var(--slc-coral)',
} as const;

const sectionHeadingStyle = {
  margin: '0 0 10px',
  padding: '0 8px',
  color: 'var(--slc-text)',
  fontSize: 16,
  fontWeight: 900,
} as const;

const emptyStateStyle = {
  margin: 0,
  padding: '28px 18px',
  borderRadius: 22,
  background: 'var(--slc-surface)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-muted)',
  textAlign: 'center',
  fontSize: 14,
} as const;

const timelineCardStyle = {
  minHeight: 66,
  display: 'grid',
  gridTemplateColumns: '58px 1fr',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 18,
  background: 'var(--slc-surface)',
  border: '1px solid var(--slc-border)',
} as const;

const timeStyle = {
  color: 'var(--slc-text)',
  fontSize: 14,
  fontWeight: 900,
} as const;

const titleStyle = {
  display: 'block',
  color: 'var(--slc-text)',
  fontSize: 15,
  fontWeight: 900,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

const metaStyle = {
  display: 'block',
  color: 'var(--slc-muted)',
  fontSize: 12,
  fontWeight: 700,
  marginTop: 3,
} as const;
