'use client';
import { FormEvent, useMemo, useState } from 'react';
import type { ScheduleItem, CompletionRecord, ClinicUpdate, Receipt } from '../../types/slc.types';
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

export function RecordsScreen({ receipts = [] }: RecordsScreenProps) {
  const [receiptItems, setReceiptItems] = useState<Receipt[]>(receipts);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ReceiptCategory>('진료비');
  const [date, setDate] = useState(() => todayInputValue());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const summary = useMemo(() => buildFinancialSummary(receiptItems), [receiptItems]);

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
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>시술비 기록</p>
          <h1 style={titleStyle}>비용</h1>
          <p style={leadStyle}>병원 일정은 캘린더에 두고, 기록 탭은 지출과 지원금만 정리해요.</p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="영수증 추가"
          style={recordsAddButtonStyle}
        >
          +
        </button>
      </header>

      <section aria-label="비용 요약" style={{ padding: '0 16px 14px' }}>
        <FinancialOverview summary={summary} receipts={receiptItems} />
      </section>

      <SubsidyCards />

      <RecentReceiptList receipts={receiptItems} onAdd={() => setSheetOpen(true)} />

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
              style={{ color: summary.net < 0 ? 'var(--slc-coral)' : 'var(--slc-text)', fontSize: 16, fontWeight: 900 }}
            >
              {formatWon(summary.net)}
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

type FinancialSummary = {
  gross: number;
  subsidy: number;
  net: number;
};

function buildFinancialSummary(receipts: Receipt[]): FinancialSummary {
  return receipts.reduce(
    (summary, receipt) => {
      if (receipt.amount < 0 || receipt.category === '정부지원금') {
        const subsidy = Math.abs(receipt.amount);
        return { ...summary, subsidy: summary.subsidy + subsidy, net: summary.net - subsidy };
      }
      return { ...summary, gross: summary.gross + receipt.amount, net: summary.net + receipt.amount };
    },
    { gross: 0, subsidy: 0, net: 0 },
  );
}

function FinancialOverview({ summary, receipts }: { summary: FinancialSummary; receipts: Receipt[] }) {
  return (
    <div data-testid="records-financial-overview" style={financialCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>이번 사이클 실부담</p>
          <strong style={{ display: 'block', color: 'var(--slc-text)', fontSize: 30, fontWeight: 950, letterSpacing: '-0.06em', lineHeight: 1.05 }}>
            {formatWon(summary.net)}
          </strong>
        </div>
        <span style={receiptCountBadgeStyle}>{receipts.length}건</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
        <SummaryCell label="결제" value={formatWon(summary.gross)} />
        <SummaryCell label="정부지원금" value={formatSupportWon(summary.subsidy)} tone="support" />
        <SummaryCell label="남은 부담" value={formatWon(summary.net)} tone="net" />
      </div>

      <CostLineChart receipts={receipts} total={summary.net} />
    </div>
  );
}

function SummaryCell({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'support' | 'net' }) {
  return (
    <div style={{ borderRadius: 16, background: tone === 'support' ? 'rgba(238, 245, 239, 0.82)' : 'rgba(255, 252, 250, 0.82)', border: '1px solid var(--slc-border)', padding: '11px 10px' }}>
      <p style={{ margin: '0 0 5px', color: 'var(--slc-muted)', fontSize: 10, fontWeight: 900 }}>{label}</p>
      <strong style={{ color: tone === 'support' ? 'var(--slc-success)' : 'var(--slc-text)', fontSize: 12, fontWeight: 950, letterSpacing: '-0.03em' }}>{value}</strong>
    </div>
  );
}

function RecentReceiptList({ receipts, onAdd }: { receipts: Receipt[]; onAdd(): void }) {
  return (
    <section aria-label="최근 비용 기록" style={{ padding: '16px 16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 10px' }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: '#B99F91', margin: 0 }}>최근 비용 기록</p>
        <button type="button" onClick={onAdd} style={inlineAddButtonStyle}>추가</button>
      </div>
      <div data-testid="financial-receipt-list" style={{ display: 'grid', gap: 8 }}>
        {receipts.length === 0 ? (
          <div style={emptyReceiptStyle}>
            <strong style={{ color: 'var(--slc-text)', fontSize: 16, fontWeight: 900 }}>아직 비용 기록이 없어요</strong>
            <p style={{ color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.5, margin: '6px 0 14px' }}>
              첫 영수증을 추가하면 그래프와 정부지원금 반영 금액이 바로 채워져요.
            </p>
            <button type="button" onClick={onAdd} style={emptyAddButtonStyle}>영수증 추가</button>
          </div>
        ) : receipts.slice(0, 8).map((receipt) => (
          <article key={receipt.id} style={receiptRowStyle}>
            <div>
              <strong style={{ color: 'var(--slc-text)', fontSize: 14, fontWeight: 900 }}>{receipt.category}</strong>
              <p style={{ color: 'var(--slc-muted)', fontSize: 11, margin: '3px 0 0' }}>{receipt.date}{receipt.note ? ` · ${receipt.note}` : ''}</p>
            </div>
            <span style={{ color: receipt.amount < 0 ? 'var(--slc-success)' : 'var(--slc-text)', fontSize: 14, fontWeight: 950 }}>
              {receipt.amount < 0 ? '-' : ''}{formatWon(Math.abs(receipt.amount))}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatWon(value: number) {
  const abs = Math.abs(value).toLocaleString('ko-KR');
  return `${value < 0 ? '-' : ''}${abs}원`;
}

function formatSupportWon(value: number) {
  return value === 0 ? '0원' : `-${formatWon(value)}`;
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

function CostLineChart({ receipts, total }: { receipts: Receipt[]; total: number }) {
  const points = buildChartPoints(receipts);
  const W = 320;
  const H = 104;
  const PAD = { top: 14, right: 16, bottom: 24, left: 56 };
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
    <div style={chartShellStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--slc-muted)', fontWeight: 900 }}>비용 시각화</p>
        <strong style={{ fontSize: 14, fontWeight: 950, color: total < 0 ? 'var(--slc-success)' : 'var(--slc-text)' }}>
          {formatWon(total)}
        </strong>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="사이클 누적 비용 차트" role="img" style={{ overflow: 'visible' }}>
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="var(--slc-border)" strokeWidth="1" />
        {points.length > 1 ? (
          <polyline points={polylinePoints} fill="none" stroke="var(--slc-coral)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="var(--slc-coral)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 7" />
        )}
        {points.map((point, index) => (
          <circle key={`${point.date}-${index}`} cx={toX(index)} cy={toY(point.cumulative)} r={index === points.length - 1 ? 4 : 3} fill="var(--slc-coral)" opacity={points.length > 1 ? 1 : 0.45} />
        ))}
        {maxY > 0 ? (
          <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fontSize="9" fill="#B5A89E" fontWeight="800">
            {formatWonShort(maxY)}
          </text>
        ) : null}
        <text x={PAD.left - 4} y={zeroY + 4} textAnchor="end" fontSize="9" fill="#B5A89E" fontWeight="800">0</text>
        <text x={PAD.left} y={H - 4} textAnchor="start" fontSize="9" fill="#B5A89E" fontWeight="800">
          {points[0] ? formatDateShort(points[0].date) : '시작'}
        </text>
        <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize="9" fill="#B5A89E" fontWeight="800">
          {points.at(-1) ? formatDateShort(points.at(-1)!.date) : '오늘'}
        </text>
      </svg>
    </div>
  );
}

function buildChartPoints(receipts: Receipt[]) {
  const sorted = [...receipts].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [{ date: todayInputValue(), cumulative: 0 }];
  return sorted.reduce<Array<{ date: string; cumulative: number }>>(
    (acc, receipt) => {
      const prev = acc[acc.length - 1]?.cumulative ?? 0;
      return [...acc, { date: receipt.date, cumulative: prev + receipt.amount }];
    },
    [],
  );
}

const SUBSIDY_INFO = [
  { title: '난임 시술비 지원', desc: '정부·지자체 지원금은 비용에서 차감해 실부담으로 보여요', action: '영수증 분류에서 정부지원금 선택' },
  { title: '지원금 처리', desc: '지원금은 자동으로 마이너스 금액으로 저장돼요', action: '결제 금액과 따로 기록' },
  { title: '연말정산 준비', desc: '진료비·약제비·검사비를 분류해 모아둘 수 있어요', action: '최근 비용 기록에서 확인' },
] as const;

function SubsidyCards() {
  return (
    <section aria-label="정부 지원금 처리" style={{ padding: '0 16px 0' }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: '#B99F91', padding: '0 8px 10px', margin: 0 }}>
        정부지원금 처리
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {SUBSIDY_INFO.map((info) => (
          <div
            key={info.title}
            style={subsidyCardStyle}
          >
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 900, color: 'var(--slc-text)' }}>{info.title}</p>
              <p style={{ margin: '0 0 3px', fontSize: 12, color: 'var(--slc-muted)', fontWeight: 700, lineHeight: 1.45 }}>{info.desc}</p>
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

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 18,
  padding: '0 24px 18px',
} as const;

const eyebrowStyle = {
  fontSize: 13,
  color: '#B5A89E',
  fontWeight: 800,
  margin: '0 0 4px',
} as const;

const titleStyle = {
  fontSize: 30,
  fontWeight: 950,
  color: 'var(--slc-text)',
  margin: 0,
  letterSpacing: '-0.06em',
  lineHeight: 1,
} as const;

const leadStyle = {
  maxWidth: 270,
  margin: '9px 0 0',
  color: 'var(--slc-muted)',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.45,
} as const;

const financialCardStyle = {
  borderRadius: 26,
  background: 'rgba(255,255,255,0.84)',
  border: '1px solid var(--slc-border)',
  boxShadow: '0 18px 46px rgba(80, 50, 40, 0.08)',
  backdropFilter: 'blur(16px)',
  padding: '18px 18px 14px',
} as const;

const receiptCountBadgeStyle = {
  flex: '0 0 auto',
  padding: '7px 11px',
  borderRadius: 999,
  background: 'var(--slc-coral-light)',
  color: 'var(--slc-coral)',
  fontSize: 12,
  fontWeight: 900,
} as const;

const chartShellStyle = {
  borderRadius: 20,
  background: 'rgba(255, 249, 246, 0.76)',
  border: '1px solid var(--slc-border)',
  padding: '13px 13px 8px',
} as const;

const subsidyCardStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.76)',
  border: '1px solid var(--slc-border)',
  backdropFilter: 'blur(14px)',
} as const;

const receiptRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: 10,
  padding: '15px 16px',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid var(--slc-border)',
  backdropFilter: 'blur(14px)',
} as const;

const emptyReceiptStyle = {
  padding: '22px 18px',
  borderRadius: 22,
  background: 'rgba(255,255,255,0.72)',
  border: '1px dashed rgba(216, 98, 77, 0.28)',
  textAlign: 'center',
} as const;

const inlineAddButtonStyle = {
  border: 0,
  background: 'transparent',
  color: 'var(--slc-coral)',
  fontSize: 12,
  fontWeight: 900,
  fontFamily: 'inherit',
  cursor: 'pointer',
} as const;

const emptyAddButtonStyle = {
  minHeight: 40,
  padding: '0 16px',
  border: 0,
  borderRadius: 999,
  background: 'var(--slc-coral)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 900,
  fontFamily: 'inherit',
  cursor: 'pointer',
} as const;

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
