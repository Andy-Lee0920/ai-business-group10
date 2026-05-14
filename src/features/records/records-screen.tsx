'use client';
import { useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/slc.types';
import { buildRecordsViewModel, RECORD_FILTERS, type RecordsFilter } from '../../domain/slc-records';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates?: ClinicUpdate[];
}

export function RecordsScreen({ items, completions, clinicUpdates = [] }: RecordsScreenProps) {
  const [filter, setFilter] = useState<RecordsFilter>('all');
  const { groups } = buildRecordsViewModel({ items, completions, clinicUpdates, filter });

  return (
    <div style={{ padding: '60px 0 16px' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 16 }}>기록</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {RECORD_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: filter === key ? '#C4614A' : '#F0EDE8',
              color: filter === key ? '#fff' : '#9B8E86',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#B5A89E', fontSize: 15 }}>{SLC_SAFE_COPY.emptyRecords}</p>
        </div>
      ) : (
        groups.map(({ date, records }) => (
          <div key={date} style={{ marginBottom: 8 }}>
            <div style={{ padding: '12px 24px 8px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C4A898' }}>{date}</span>
            </div>
            {records.map((record) => (
              <div key={`${record.kind}-${record.id}`} style={{
                margin: '0 16px 8px',
                background: '#fff', borderRadius: 16, padding: '14px 18px',
                border: '1.5px solid #F0EDE8',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2A1F1A', margin: '0 0 4px' }}>{record.title}</p>
                  <p style={{ fontSize: 12, color: '#B5A89E', margin: 0 }}>{record.meta}</p>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                  background: record.statusLabel === '완료' ? '#FFF0EB' : record.statusLabel === '놓침' ? '#FFF0F0' : record.statusLabel === '변경' ? '#F1EDFF' : '#F0EDE8',
                  color: record.statusLabel === '완료' ? '#C4614A' : record.statusLabel === '놓침' ? '#E07070' : record.statusLabel === '변경' ? '#7F6BCB' : '#9B8E86',
                  flex: '0 0 auto',
                }}>
                  {record.statusLabel}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
