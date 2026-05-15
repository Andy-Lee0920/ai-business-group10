'use client';
import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate, Receipt } from '../../types/slc.types';
import { buildRecordsViewModel, RECORD_FILTERS, type RecordsFilter, type RecordsViewRecord } from '../../domain/slc-records';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';

const RECEIPT_CATEGORIES = ['진료비', '약제비', '검사비', '정부지원금', '기타'] as const;
type ReceiptCategory = typeof RECEIPT_CATEGORIES[number];

type ReceiptResponse = {
  receipt?: Receipt;
  error?: string;
};

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates?: ClinicUpdate[];
  receipts?: Receipt[];
}

export function RecordsScreen({ items, completions, clinicUpdates = [], receipts = [] }: RecordsScreenProps) {
  const [filter, setFilter] = useState<RecordsFilter>('all');
  const [receiptItems, setReceiptItems] = useState<Receipt[]>(receipts);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ReceiptCategory>('진료비');
  const [date, setDate] = useState(() => todayInputValue());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { groups } = buildRecordsViewModel({ items, completions, clinicUpdates, filter });
  const receiptTotal = useMemo(() => receiptItems.reduce((sum, receipt) => sum + receipt.amount, 0), [receiptItems]);
  const cycleDay = useMemo(() => computeCycleDay(items), [items]);

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedAmount = normalizeReceiptAmount(amount, category);
    if (normalizedAmount === null) {
      setError('영수증 금액을 입력해 주세요.');
      return;
    }

    setSaving(true);
    const payload = { amount: normalizedAmount, category, date, note };
    try {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as ReceiptResponse;
      if (!response.ok || !result.receipt) throw new Error(result.error ?? '영수증 저장에 실패했어요.');
      setReceiptItems((current) => [result.receipt as Receipt, ...current]);
      setAmount('');
      setNote('');
      setSheetOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '영수증 저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AmbientStoryBackground
      asset={slcAssets.home.missedRecovery}
      intensity="subtle"
      style={{ minHeight: '100dvh', padding: '54px 0 112px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 24px 18px' }}>
        <div>
          <p style={{ fontSize: 13, color: '#B5A89E', fontWeight: 700, margin: '0 0 4px' }}>최근 기록</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--slc-text)', margin: 0, letterSpacing: '-0.05em' }}>기록</h1>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="영수증 추가"
          style={recordsAddButtonStyle}
        >
          +
        </button>
      </div>

      {cycleDay !== null ? (
        <div style={cycleDayHeroStyle}>
          <p style={{ margin: '0 0 4px', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>시작일 기준</p>
          <p style={{ margin: 0, color: 'var(--slc-text)', fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.2 }}>
            주사 시작 <strong style={{ color: 'var(--slc-coral)' }}>{cycleDay}일차</strong>
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 700 }}>
            첫 주사 일정 기준 · 오늘까지
          </p>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 24px 16px', scrollbarWidth: 'none' }}>
        {RECORD_FILTERS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setFilter(key)} style={filterChipStyle(filter === key)}>
            {label}
          </button>
        ))}
      </div>

      {receiptItems.length >= 2 ? (
        <div style={{ padding: '0 16px 16px' }}>
          <CostLineChart receipts={receiptItems} total={receiptTotal} />
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div style={{ padding: '36px 24px 60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--slc-text)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 8px' }}>아직 기록이 없어요</p>
          <p style={{ color: '#B5A89E', fontSize: 13, lineHeight: 1.5, margin: 0 }}>완료하면 여기에 남겨둘게요.</p>
        </div>
      ) : (
        <div data-testid="records-timeline" style={{ padding: '0 16px' }}>
          {groups.map(({ date: groupDate, records }) => (
            <section key={groupDate} style={{ marginBottom: 12 }} aria-label={`${groupDate} 기록`}>
              <div style={{ padding: '12px 8px 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#B99F91' }}>{groupDate}</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {records.map((record) => <RecordCard key={`${record.kind}-${record.id}`} record={record} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <SubsidyCards />

      {sheetOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setSheetOpen(false)}
          style={sheetBackdropStyle}
        />
      ) : null}

      {sheetOpen ? (
        <div role="dialog" aria-label="영수증 입력" style={sheetPanelStyle}>
          <div style={sheetHandleBarStyle} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--slc-coral)', fontWeight: 900, margin: '0 0 4px' }}>영수증 입력</p>
              <h2 style={{ color: 'var(--slc-text)', fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
                비용도 함께 기록해요
              </h2>
            </div>
            <strong
              data-testid="receipt-total"
              style={{ color: receiptTotal < 0 ? 'var(--slc-coral)' : 'var(--slc-text)', fontSize: 16, fontWeight: 900 }}
            >
              {formatWon(receiptTotal)}
            </strong>
          </div>
          <form data-testid="receipt-form" onSubmit={submitReceipt} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={fieldLabelStyle}>
                분류
                <select value={category} onChange={(event) => setCategory(toReceiptCategory(event.currentTarget.value))} style={fieldStyle}>
                  {RECEIPT_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label style={fieldLabelStyle}>
                날짜
                <input type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} style={fieldStyle} required />
              </label>
            </div>
            <label style={fieldLabelStyle}>
              금액
              <input
                inputMode="numeric"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.currentTarget.value)}
                placeholder={category === '정부지원금' ? '지원금 금액' : '결제 금액'}
                style={fieldStyle}
                required
              />
            </label>
            <label style={fieldLabelStyle}>
              메모
              <input
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                placeholder="예: 초음파, 주사 처방"
                style={fieldStyle}
              />
            </label>
            {error ? <p role="alert" style={{ color: 'var(--slc-coral)', fontSize: 12, fontWeight: 800, margin: 0 }}>{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              style={sheetSubmitStyle(saving)}
            >
              {saving ? '저장 중' : '영수증 저장'}
            </button>
          </form>
        </div>
      ) : null}
    </AmbientStoryBackground>
  );
}

function RecordCard({ record }: { record: RecordsViewRecord }) {
  const tone = recordTone(record);
  return (
    <article data-testid="records-calm-card" style={{
      minHeight: 84,
      background: 'rgba(255, 252, 250, 0.9)',
      border: '1.5px solid #EFE7E0',
      borderRadius: 22,
      padding: '16px 18px',
      boxShadow: '0 8px 26px rgba(80, 50, 40, 0.055)',
      backdropFilter: 'blur(14px)',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'start',
      gap: 12,
    }}>
      <div>
        <p style={{ fontSize: 12, color: '#B5A89E', fontWeight: 800, margin: '0 0 7px' }}>{recordCaption(record)}</p>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.25, color: 'var(--slc-text)', margin: 0 }}>{record.title}</h2>
      </div>
      <span style={{ display: 'grid', justifyItems: 'end', gap: 6 }}>
        <span style={{ flex: '0 0 auto', fontSize: 12, fontWeight: 900, padding: '6px 11px', borderRadius: 999, background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}>
          {record.statusLabel}
        </span>
        {record.kind === 'schedule' ? (
          <Link href={`/schedule/${record.id}/edit`} aria-label={`${record.title} 수정`} style={{ color: 'var(--slc-coral)', fontSize: 22, lineHeight: 1, fontWeight: 900, textDecoration: 'none' }}>›</Link>
        ) : null}
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
  if (record.statusLabel === '완료') return { bg: '#EEF5EF', fg: 'var(--slc-success)', border: '#C9DCCB' };
  if (record.statusLabel === '놓침') return { bg: '#FFF0F0', fg: '#C44F4F', border: '#F2B8B8' };
  if (record.type === 'change') return { bg: '#F1EDFF', fg: '#705CB8', border: '#D8CEF9' };
  return { bg: '#F8F4F0', fg: 'var(--slc-muted)', border: '#EFE7E0' };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatWon(value: number) {
  const abs = Math.abs(value).toLocaleString('ko-KR');
  return `${value < 0 ? '-' : ''}${abs}원`;
}

function normalizeReceiptAmount(value: string, category: ReceiptCategory) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed === 0) return null;
  const positive = Math.abs(parsed);
  return category === '정부지원금' ? -positive : positive;
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function toReceiptCategory(value: string): ReceiptCategory {
  return RECEIPT_CATEGORIES.find((category) => category === value) ?? '기타';
}

const fieldLabelStyle = {
  display: 'grid',
  gap: 5,
  color: 'var(--slc-muted)',
  fontSize: 11,
  fontWeight: 900,
} as const;

const fieldStyle = {
  minHeight: 42,
  borderRadius: 14,
  border: '1px solid var(--slc-border)',
  background: 'var(--slc-bg)',
  color: 'var(--slc-text)',
  padding: '0 12px',
  fontSize: 14,
  fontWeight: 800,
  fontFamily: 'inherit',
} as const;

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

function computeCycleDay(items: ScheduleItem[]): number | null {
  const first = items
    .filter((item) => item.type === 'injection')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  if (!first) return null;
  const diffDays = Math.floor((Date.now() - new Date(first.scheduled_at).getTime()) / 86_400_000);
  return diffDays < 0 ? null : diffDays + 1;
}

function CostLineChart({ receipts, total }: { receipts: Receipt[]; total: number }) {
  const points = [...receipts]
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce<Array<{ date: string; cumulative: number }>>(
      (acc, receipt) => {
        const prev = acc[acc.length - 1]?.cumulative ?? 0;
        return [...acc, { date: receipt.date, cumulative: prev + receipt.amount }];
      },
      [],
    );

  const W = 320;
  const H = 100;
  const PAD = { top: 12, right: 16, bottom: 24, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const amounts = points.map((point) => point.cumulative);
  const minY = Math.min(0, ...amounts);
  const maxY = Math.max(0, ...amounts);
  const rangeY = maxY - minY || 1;

  function toX(index: number) {
    return PAD.left + (index / Math.max(points.length - 1, 1)) * innerW;
  }

  function toY(value: number) {
    return PAD.top + (1 - (value - minY) / rangeY) * innerH;
  }

  const polylinePoints = points.map((point, index) => `${toX(index)},${toY(point.cumulative)}`).join(' ');
  const zeroY = toY(0);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.88)',
      border: '1px solid var(--slc-border)',
      borderRadius: 22,
      padding: '14px 16px 10px',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--slc-muted)', fontWeight: 900 }}>사이클 누적 비용</p>
        <strong style={{ fontSize: 15, fontWeight: 900, color: total < 0 ? 'var(--slc-coral)' : 'var(--slc-text)' }}>
          {formatWon(total)}
        </strong>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="사이클 누적 비용 차트" role="img" style={{ overflow: 'visible' }}>
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="var(--slc-border)" strokeWidth="1" />
        <polyline points={polylinePoints} fill="none" stroke="var(--slc-coral)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {points.length > 0 ? (
          <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].cumulative)} r="4" fill="var(--slc-coral)" />
        ) : null}
        {maxY > 0 ? (
          <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fontSize="9" fill="#B5A89E" fontWeight="800">
            {formatWonShort(maxY)}
          </text>
        ) : null}
        <text x={PAD.left - 4} y={zeroY + 4} textAnchor="end" fontSize="9" fill="#B5A89E" fontWeight="800">0</text>
        {points.length > 0 ? (
          <>
            <text x={PAD.left} y={H - 4} textAnchor="start" fontSize="9" fill="#B5A89E" fontWeight="800">
              {formatDateShort(points[0].date)}
            </text>
            <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize="9" fill="#B5A89E" fontWeight="800">
              {formatDateShort(points[points.length - 1].date)}
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}

const SUBSIDY_INFO = [
  { title: '난임 시술비 지원', desc: '최대 110만원 · 소득 무관', action: '국민행복카드로 신청' },
  { title: '지자체 추가 지원', desc: '시·군·구별 10~50만원 추가', action: '거주지 보건소 문의' },
  { title: '의료비 세액공제', desc: '총급여 3% 초과분 15% 공제', action: '연말정산 의료비 항목' },
] as const;

function SubsidyCards() {
  return (
    <section aria-label="정부 지원 안내" style={{ padding: '8px 16px 0' }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: '#B99F91', padding: '0 8px 10px', margin: 0 }}>
        정부 지원 안내
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {SUBSIDY_INFO.map((info) => (
          <div
            key={info.title}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid var(--slc-border)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 900, color: 'var(--slc-text)' }}>{info.title}</p>
              <p style={{ margin: '0 0 3px', fontSize: 12, color: 'var(--slc-muted)', fontWeight: 700 }}>{info.desc}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--slc-coral)', fontWeight: 900 }}>{info.action}</p>
            </div>
            <span aria-hidden="true" style={{ color: 'var(--slc-muted)', fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatWonShort(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function formatDateShort(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  if (!month || !day) return dateStr;
  return `${Number(month)}/${Number(day)}`;
}

const recordsAddButtonStyle = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: 'var(--slc-coral-light)',
  border: '1.5px solid var(--slc-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--slc-coral)',
  fontSize: 22,
  cursor: 'pointer',
  fontFamily: 'inherit',
} as const;

const cycleDayHeroStyle = {
  margin: '0 16px 16px',
  padding: '18px 20px',
  borderRadius: 22,
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid var(--slc-border)',
  backdropFilter: 'blur(14px)',
} as const;

const sheetBackdropStyle = {
  position: 'fixed' as const,
  inset: 0,
  zIndex: 49,
  background: 'rgba(30,20,15,0.38)',
  backdropFilter: 'blur(2px)',
} as const;

const sheetPanelStyle = {
  position: 'fixed' as const,
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 430,
  zIndex: 50,
  background: 'var(--slc-bg)',
  borderRadius: '24px 24px 0 0',
  padding: '12px 20px 48px',
  boxShadow: '0 -8px 40px rgba(30,20,15,0.14)',
} as const;

const sheetHandleBarStyle = {
  width: 36,
  height: 4,
  borderRadius: 999,
  background: 'var(--slc-border)',
  margin: '0 auto 20px',
} as const;

function sheetSubmitStyle(saving: boolean) {
  return {
    minHeight: 46,
    border: 0,
    borderRadius: 999,
    background: 'var(--slc-coral)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 900,
    fontFamily: 'inherit',
    cursor: saving ? 'wait' : 'pointer',
    opacity: saving ? 0.72 : 1,
  } as const;
}
