'use client';
import { useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/slc.types';
import { buildRecordsViewModel, RECORD_FILTERS, type RecordsFilter, type RecordsViewRecord } from '../../domain/slc-records';
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
    <div style={{ minHeight: '100dvh', padding: '54px 0 112px', background: 'var(--slc-bg)' }}>
      <div style={{ padding: '0 24px 18px' }}>
        <p style={{ fontSize: 13, color: '#B5A89E', fontWeight: 700, margin: '0 0 4px' }}>최근 7일</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--slc-text)', margin: '0 0 8px', letterSpacing: '-0.05em' }}>기록</h1>
        <p style={{ fontSize: 13, color: '#9B8E86', lineHeight: 1.45, margin: '0 0 18px' }}>완료한 일만 조용히 모아둘게요.</p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {RECORD_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={filterChipStyle(filter === key)}>{label}</button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ padding: '36px 24px 60px', textAlign: 'center' }}>
          <SLCIllustration asset={slcAssets.empty.records} size="empty" style={{ opacity: 0.82, marginBottom: 12 }} />
          <p style={{ color: 'var(--slc-text)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 8px' }}>아직 기록이 없어요</p>
          <p style={{ color: '#B5A89E', fontSize: 13, lineHeight: 1.5, margin: 0 }}>완료하면 여기에 남겨둘게요.</p>
        </div>
      ) : (
        <div data-testid="records-timeline" style={{ padding: '0 16px' }}>
          {groups.map(({ date, records }) => (
            <section key={date} style={{ marginBottom: 12 }} aria-label={`${date} 기록`}>
              <div style={{ padding: '12px 8px 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#B99F91' }}>{date}</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {records.map((record) => <RecordCard key={`${record.kind}-${record.id}`} record={record} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record }: { record: RecordsViewRecord }) {
  const tone = recordTone(record);
  return (
    <article data-testid="records-calm-card" style={{
      minHeight: 84,
      background: 'var(--slc-card)',
      border: '1.5px solid #EFE7E0',
      borderRadius: 22,
      padding: '16px 18px',
      boxShadow: '0 8px 26px rgba(80, 50, 40, 0.055)',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'start',
      gap: 12,
    }}>
      <div>
        <p style={{ fontSize: 12, color: '#B5A89E', fontWeight: 800, margin: '0 0 7px' }}>{recordCaption(record)}</p>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.25, color: 'var(--slc-text)', margin: 0 }}>{record.title}</h2>
      </div>
      <span style={{ flex: '0 0 auto', fontSize: 12, fontWeight: 900, padding: '6px 11px', borderRadius: 999, background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}>
        {record.statusLabel}
      </span>
    </article>
  );
}

function recordCaption(record: RecordsViewRecord) {
  const parts = [formatTime(record.at), recordTypeLabel(record.type), injectionSiteFromMeta(record.meta)];
  return parts.filter(Boolean).join(' · ');
}

function recordTypeLabel(type: RecordsViewRecord['type']) {
  if (type === 'clinic') return '병원';
  if (type === 'change') return '변경';
  if (type === 'injection') return '주사';
  return '복용';
}

function injectionSiteFromMeta(meta: string) {
  return ['왼쪽 위', '오른쪽 위', '왼쪽 아래', '오른쪽 아래'].find((site) => meta.includes(site)) ?? '';
}

function recordTone(record: RecordsViewRecord) {
  if (record.statusLabel === '완료') return { bg: 'var(--slc-coral-light)', fg: 'var(--slc-coral)', border: '#F0C7BB' };
  if (record.statusLabel === '놓침') return { bg: '#FFF0F0', fg: '#C44F4F', border: '#F2B8B8' };
  if (record.type === 'change') return { bg: '#F1EDFF', fg: '#705CB8', border: '#D8CEF9' };
  return { bg: '#F8F4F0', fg: 'var(--slc-muted)', border: '#EFE7E0' };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function filterChipStyle(active: boolean) {
  return {
    minHeight: 44,
    padding: '10px 15px',
    borderRadius: 999,
    background: active ? 'var(--slc-coral)' : '#F8F4F0',
    color: active ? '#fff' : 'var(--slc-muted)',
    border: active ? '1px solid var(--slc-coral)' : '1px solid #EFE7E0',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
}
