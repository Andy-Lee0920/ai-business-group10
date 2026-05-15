'use client';
import { FormEvent, useMemo, useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate, Receipt } from '../../types/slc.types';
import { buildRecordsViewModel, RECORD_FILTERS, type RecordsFilter, type RecordsViewRecord } from '../../domain/slc-records';
import { SLCIllustration } from '../../components/slc-illustration';
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
  const { groups } = buildRecordsViewModel({ items, completions, clinicUpdates, filter });
  const receiptTotal = useMemo(() => receiptItems.reduce((sum, receipt) => sum + receipt.amount, 0), [receiptItems]);

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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '영수증 저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

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

      <ReceiptPanel
        amount={amount}
        category={category}
        date={date}
        note={note}
        receipts={receiptItems}
        total={receiptTotal}
        saving={saving}
        error={error}
        onAmountChange={setAmount}
        onCategoryChange={setCategory}
        onDateChange={setDate}
        onNoteChange={setNote}
        onSubmit={submitReceipt}
      />

      {groups.length === 0 ? (
        <div style={{ padding: '36px 24px 60px', textAlign: 'center' }}>
          <SLCIllustration asset={slcAssets.empty.records} size="empty" style={{ opacity: 0.82, marginBottom: 12 }} />
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
    </div>
  );
}

function ReceiptPanel({
  amount,
  category,
  date,
  note,
  receipts,
  total,
  saving,
  error,
  onAmountChange,
  onCategoryChange,
  onDateChange,
  onNoteChange,
  onSubmit,
}: {
  amount: string;
  category: ReceiptCategory;
  date: string;
  note: string;
  receipts: Receipt[];
  total: number;
  saving: boolean;
  error: string | null;
  onAmountChange(value: string): void;
  onCategoryChange(value: ReceiptCategory): void;
  onDateChange(value: string): void;
  onNoteChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}) {
  return (
    <section aria-label="영수증 기록" style={{ padding: '0 16px 16px' }}>
      <div style={{ background: 'var(--slc-surface)', border: '1px solid var(--slc-border)', borderRadius: 24, padding: 18, boxShadow: '0 10px 28px rgba(80, 50, 40, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--slc-coral)', fontWeight: 900, margin: '0 0 5px' }}>영수증 입력</p>
            <h2 style={{ color: 'var(--slc-text)', fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>비용도 함께 기록해요</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', color: 'var(--slc-muted)', fontSize: 11, fontWeight: 800, marginBottom: 3 }}>누적 합계</span>
            <strong data-testid="receipt-total" style={{ color: total < 0 ? 'var(--slc-coral)' : 'var(--slc-text)', fontSize: 16, fontWeight: 900 }}>{formatWon(total)}</strong>
          </div>
        </div>

        <form data-testid="receipt-form" onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={fieldLabelStyle}>
              분류
              <select value={category} onChange={(event) => onCategoryChange(toReceiptCategory(event.currentTarget.value))} style={fieldStyle}>
                {RECEIPT_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label style={fieldLabelStyle}>
              날짜
              <input type="date" value={date} onChange={(event) => onDateChange(event.currentTarget.value)} style={fieldStyle} required />
            </label>
          </div>
          <label style={fieldLabelStyle}>
            금액
            <input inputMode="numeric" type="number" value={amount} onChange={(event) => onAmountChange(event.currentTarget.value)} placeholder={category === '정부지원금' ? '지원금 금액' : '결제 금액'} style={fieldStyle} required />
          </label>
          <label style={fieldLabelStyle}>
            메모
            <input value={note} onChange={(event) => onNoteChange(event.currentTarget.value)} placeholder="예: 초음파, 주사 처방" style={fieldStyle} />
          </label>
          {error ? <p role="alert" style={{ color: 'var(--slc-coral)', fontSize: 12, fontWeight: 800, margin: 0 }}>{error}</p> : null}
          <button type="submit" disabled={saving} style={{ minHeight: 46, border: 0, borderRadius: 999, background: 'var(--slc-coral)', color: '#fff', fontSize: 14, fontWeight: 900, fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.72 : 1 }}>
            {saving ? '저장 중' : '영수증 저장'}
          </button>
        </form>

        <div data-testid="receipt-list" style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          {receipts.length === 0 ? (
            <p style={{ color: 'var(--slc-muted)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>아직 저장된 영수증이 없어요.</p>
          ) : receipts.slice(0, 5).map((receipt) => (
            <article key={receipt.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10, borderTop: '1px solid var(--slc-border)', paddingTop: 10 }}>
              <div>
                <strong style={{ color: 'var(--slc-text)', fontSize: 13, fontWeight: 900 }}>{receipt.category}</strong>
                <p style={{ color: 'var(--slc-muted)', fontSize: 11, margin: '3px 0 0' }}>{receipt.date}{receipt.note ? ` · ${receipt.note}` : ''}</p>
              </div>
              <span style={{ color: receipt.amount < 0 ? 'var(--slc-coral)' : 'var(--slc-text)', fontSize: 13, fontWeight: 900 }}>{formatWon(receipt.amount)}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
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
