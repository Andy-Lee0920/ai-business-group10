import { PresentationTestbedNav, buildPresentationItems } from './presentation-testbed';
import type { ScheduleItem } from '../../types/slc.types';

export function PresentationCalendarDemo() {
  const items = buildPresentationItems();
  const grouped = groupByDay(items);

  return (
    <main data-testid="presentation-calendar-demo" style={{ minHeight: '100dvh', padding: 'var(--fevio-page-top) var(--fevio-page-gutter) var(--fevio-page-bottom)', background: 'var(--slc-bg)' }}>
      <header style={{ marginBottom: 18, display: 'grid', gap: 10 }}>
        <p style={{ margin: 0, color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>시나리오 테스트 베드</p>
        <h1 style={{ margin: 0, color: 'var(--slc-text)', fontSize: 28, letterSpacing: '-0.05em' }}>Calendar</h1>
        <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.5 }}>병원 안내가 여러 날짜 일정으로 펼쳐졌을 때의 캘린더형 확인 화면입니다.</p>
        <PresentationTestbedNav current="calendar" />
      </header>

      <section style={{ display: 'grid', gap: 12 }}>
        {grouped.map((group) => (
          <article key={group.date} style={{ borderRadius: 24, background: 'var(--slc-card)', border: '1px solid #EFE7E0', boxShadow: '0 8px 26px rgba(80, 50, 40, 0.055)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #F1E8E1' }}>
              <strong style={{ color: 'var(--slc-text)', fontSize: 17, letterSpacing: '-0.03em' }}>{group.date}</strong>
            </div>
            <div style={{ display: 'grid' }}>
              {group.items.map((item) => (
                <div key={item.id} style={{ minHeight: 64, display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F7EFE9' }}>
                  <span style={{ color: 'var(--slc-text)', fontSize: 14, fontWeight: 900 }}>{formatTime(item.scheduled_at)}</span>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--slc-text)', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</strong>
                    <small style={{ color: 'var(--slc-muted)', fontSize: 12, fontWeight: 700 }}>{typeLabel(item.type)}</small>
                  </span>
                  <span style={{ padding: '5px 10px', borderRadius: 999, background: badgeBg(item), color: badgeFg(item), fontSize: 11, fontWeight: 900 }}>{statusLabel(item)}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function groupByDay(items: ScheduleItem[]) {
  const map = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const key = new Date(item.scheduled_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return Array.from(map.entries()).map(([date, dayItems]) => ({
    date,
    items: dayItems.sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()),
  }));
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function typeLabel(type: ScheduleItem['type']) {
  if (type === 'clinic') return '병원 방문';
  if (type === 'medication') return '복용';
  return '주사';
}

function statusLabel(item: ScheduleItem) {
  if (item.status === 'completed') return '완료';
  if (item.status === 'missed') return '확인';
  return '예정';
}

function badgeBg(item: ScheduleItem) {
  if (item.status === 'completed') return '#EEF5EF';
  if (item.status === 'missed') return '#FFF0F0';
  return '#F8F4F0';
}

function badgeFg(item: ScheduleItem) {
  if (item.status === 'completed') return 'var(--slc-success)';
  if (item.status === 'missed') return '#C44F4F';
  return 'var(--slc-muted)';
}
