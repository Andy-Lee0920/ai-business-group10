'use client';
import { useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/slc.types';
import { buildRecordsViewModel, RECORD_FILTERS, type RecordsFilter, type RecordsViewRecord } from '../../domain/slc-records';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets } from '../../design/slc-assets';

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates?: ClinicUpdate[];
}

export function RecordsScreen({ items, completions, clinicUpdates = [] }: RecordsScreenProps) {
  const [filter, setFilter] = useState<RecordsFilter>('all');
  const { groups } = buildRecordsViewModel({ items, completions, clinicUpdates, filter });

  return (
    <div style={{ minHeight: '100dvh', padding: '60px 0 112px', background: 'var(--slc-bg)' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#2A1F1A', margin: '0 0 18px', letterSpacing: '-0.03em' }}>기록</h1>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {RECORD_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={filterChipStyle(filter === key)}>{label}</button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ padding: '56px 24px', textAlign: 'center' }}>
          <SLCIllustration asset={slcAssets.empty.records} size="empty" />
          <p style={{ color: '#9B8E86', fontSize: 15, lineHeight: 1.55, margin: 0 }}>{SLC_SAFE_COPY.emptyRecords}</p>
        </div>
      ) : (
        <div data-testid="records-timeline" style={{ padding: '0 16px' }}>
          {groups.map(({ date, records }) => (
            <section key={date} style={{ marginBottom: 18 }}>
              <div style={{ padding: '14px 8px 10px' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#B99F91' }}>{date}</span>
              </div>
              <div style={{ position: 'relative', display: 'grid', gap: 10 }}>
                {records.map((record, index) => <TimelineRecord key={`${record.kind}-${record.id}`} record={record} isLast={index === records.length - 1} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineRecord({ record, isLast }: { record: RecordsViewRecord; isLast: boolean }) {
  const tone = recordTone(record);
  return (
    <article style={{ position: 'relative', display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12 }}>
      {!isLast && <span aria-hidden style={{ position: 'absolute', left: 16, top: 34, bottom: -13, width: 1, background: '#E8DDD5' }} />}
      <span aria-hidden style={{ zIndex: 1, width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}`, fontSize: 15, fontWeight: 900 }}>
        {recordIcon(record)}
      </span>
      <div style={{ minHeight: 86, background: '#FFFBF8', border: '1px solid #F0EDE8', borderRadius: 18, padding: '14px 16px', boxShadow: '0 6px 20px rgba(80, 50, 40, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: '#8A7B73', fontWeight: 800, margin: '0 0 6px' }}>{formatTime(record.at)}</p>
            <p style={{ fontSize: 16, color: '#2A1F1A', fontWeight: 900, lineHeight: 1.25, margin: '0 0 5px' }}>{record.title}</p>
            <p style={{ fontSize: 12, color: '#9B8E86', lineHeight: 1.45, margin: 0 }}>{record.meta}</p>
          </div>
          <span style={{ flex: '0 0 auto', fontSize: 11, fontWeight: 900, padding: '5px 10px', borderRadius: 999, background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}>
            {record.statusLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

function recordIcon(record: RecordsViewRecord) {
  if (record.type === 'clinic') return '🏥';
  if (record.type === 'change') return '↻';
  if (record.type === 'medication') return '💊';
  return '✓';
}

function recordTone(record: RecordsViewRecord) {
  if (record.statusLabel === '완료') return { bg: '#FFF0EB', fg: '#C4614A', border: '#F0C7BB' };
  if (record.statusLabel === '놓침') return { bg: '#FFF0F0', fg: '#C44F4F', border: '#F2B8B8' };
  if (record.type === 'change') return { bg: '#F1EDFF', fg: '#705CB8', border: '#D8CEF9' };
  if (record.type === 'clinic') return { bg: '#F4F6EF', fg: '#687A4E', border: '#DDE5D2' };
  return { bg: '#F8F4F0', fg: '#9B8E86', border: '#EFE7E0' };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function filterChipStyle(active: boolean) {
  return {
    minHeight: 44,
    padding: '10px 15px', borderRadius: 999,
    background: active ? '#C4614A' : '#F0EDE8',
    color: active ? '#fff' : '#9B8E86',
    border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
  } as const;
}
