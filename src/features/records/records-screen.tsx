'use client';
import { useState } from 'react';
import type { ScheduleItem, CompletionRecord } from '../../types/slc.types';

type FilterType = 'all' | 'injection' | 'medication' | 'clinic';

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
}

export function RecordsScreen({ items, completions }: RecordsScreenProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? items : items.filter((it) => it.type === filter);
  const completionMap = new Map(completions.map((c) => [c.schedule_item_id, c]));
  const grouped = groupByDate(filtered);

  const filters: Array<{ key: FilterType; label: string }> = [
    { key: 'all', label: '전체' },
    { key: 'injection', label: '주사' },
    { key: 'medication', label: '복용' },
    { key: 'clinic', label: '병원' },
  ];

  return (
    <div style={{ padding: '60px 0 16px' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 16 }}>기록</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {filters.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: filter === key ? '#C4614A' : '#F0EDE8',
              color: filter === key ? '#fff' : '#9B8E86',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#B5A89E', fontSize: 15 }}>최근 7일간 기록이 없어요</p>
        </div>
      ) : (
        grouped.map(({ date, items: dayItems }) => (
          <div key={date} style={{ marginBottom: 8 }}>
            <div style={{ padding: '12px 24px 8px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C4A898' }}>{date}</span>
            </div>
            {dayItems.map((item) => {
              const completion = completionMap.get(item.id);
              const timeStr = new Date(item.scheduled_at).toLocaleTimeString('ko-KR', {
                hour: '2-digit', minute: '2-digit', hour12: false,
              });
              const completedTime = completion
                ? new Date(completion.completed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                : null;

              return (
                <div key={item.id} style={{
                  margin: '0 16px 8px',
                  background: '#fff', borderRadius: 16, padding: '14px 18px',
                  border: '1.5px solid #F0EDE8',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2A1F1A', margin: '0 0 4px' }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: '#B5A89E', margin: 0 }}>
                      예정 {timeStr}{completedTime ? ` · 완료 ${completedTime}` : ''}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                    background: item.status === 'completed' ? '#FFF0EB' : item.status === 'missed' ? '#FFF0F0' : '#F0EDE8',
                    color: item.status === 'completed' ? '#C4614A' : item.status === 'missed' ? '#E07070' : '#9B8E86',
                  }}>
                    {item.status === 'completed' ? '완료' : item.status === 'missed' ? '놓침' : '예정'}
                  </span>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

function groupByDate(items: ScheduleItem[]): Array<{ date: string; items: ScheduleItem[] }> {
  const map = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const date = new Date(item.scheduled_at).toLocaleDateString('ko-KR', {
      month: 'long', day: 'numeric', weekday: 'short',
    });
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(item);
  }
  return Array.from(map.entries()).map(([date, dateItems]) => ({ date, items: dateItems }));
}
