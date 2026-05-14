import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/slc.types';
import { completedLabel } from '../../types/slc.types';
import { partnerStateCopy } from './partner-state';

interface Props {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  latestClinicUpdate: ClinicUpdate | null;
}

export function PartnerView({ items, completions, latestClinicUpdate }: Props) {
  const completionSet = new Set(completions.map((c) => c.schedule_item_id));
  const completedItems = items.filter((it) => completionSet.has(it.id) || it.status === 'completed');
  const pendingItems = items.filter((it) => !completionSet.has(it.id) && it.status !== 'completed');

  const stateCopy = partnerStateCopy(items.length === 0 ? 'linked_no_schedule' : 'linked_with_schedule');

  return (
    <div style={{ padding: '60px 24px 24px' }}>
      <p style={{ fontSize: 13, color: '#B5A89E', marginBottom: 4 }}>파트너 뷰 · 읽기 전용</p>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 8 }}>{stateCopy.title}</h1>
      <p style={{ fontSize: 14, color: '#9B8E86', lineHeight: 1.55, margin: '0 0 24px' }}>{stateCopy.description}</p>

      {latestClinicUpdate && (
        <div style={{ background: '#FFF8F5', borderRadius: 16, padding: '14px 18px', border: '1.5px solid #F4D4C8', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#C4614A', fontWeight: 600, margin: 0 }}>오늘 병원 방문 후 일정이 변경됐어요</p>
        </div>
      )}

      {completedItems.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9B8E86', marginBottom: 12 }}>완료</h2>
          {completedItems.map((item) => {
            const time = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit', minute: '2-digit', hour12: false,
            });
            return (
              <div key={item.id} style={{
                background: '#F7F5F2', borderRadius: 14, padding: '12px 16px',
                marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 15, color: '#6B5E55' }}>{time} {item.title} {completedLabel(item.type)}했어요</span>
                <span style={{ fontSize: 12, color: '#C4614A', fontWeight: 600 }}>읽기 전용</span>
              </div>
            );
          })}
        </section>
      )}

      {pendingItems.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9B8E86', marginBottom: 12 }}>다음 일정</h2>
          {pendingItems.map((item) => {
            const time = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit', minute: '2-digit', hour12: false,
            });
            return (
              <div key={item.id} style={{
                background: '#fff', borderRadius: 14, padding: '12px 16px',
                marginBottom: 8, border: '1.5px solid #F0EDE8',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 15, color: '#2A1F1A', fontWeight: 500 }}>다음은 {time} {item.title} 예정이에요</span>
                <span style={{ fontSize: 12, color: '#9B8E86' }}>읽기 전용</span>
              </div>
            );
          })}
        </section>
      )}

      {items.length === 0 && (
        <p style={{ color: '#B5A89E', textAlign: 'center', fontSize: 15, marginTop: 60 }}>
          {stateCopy.title}
        </p>
      )}
    </div>
  );
}
