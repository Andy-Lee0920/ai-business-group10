import { NextRequest, NextResponse } from 'next/server';
import { createCaptureStore, type ConfirmItem } from '../../../src/lib/capture-confirm-store';
import type { CardType } from '../../../src/types/care-cards.types';

type ScheduleMode = 'add' | 'change' | 'cancel';
type SchedulePurpose = 'visit' | 'injection' | 'test' | 'procedure' | 'other';
type ScheduleBody = {
  mode?: unknown;
  purpose?: unknown;
  date?: unknown;
  time?: unknown;
  memo?: unknown;
};

const PURPOSE_LABELS: Record<SchedulePurpose, string> = {
  visit: '방문',
  injection: '주사',
  test: '검사',
  procedure: '시술',
  other: '기타',
};

const PURPOSE_CARD_TYPES: Record<SchedulePurpose, CardType> = {
  visit: 'clinic_visit',
  injection: 'injection',
  test: 'clinic_visit',
  procedure: 'clinic_visit',
  other: 'general_action',
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ScheduleBody;
  const mode = normalizeMode(body.mode);
  const purpose = normalizePurpose(body.purpose);
  const date = normalizeDate(body.date);
  const time = normalizeTime(body.time);
  const memo = normalizeMemo(body.memo);

  if (!mode || !purpose || !date || !time) {
    return NextResponse.json({ error: 'Valid schedule mode, purpose, date, and time are required.' }, { status: 400 });
  }

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const summary = buildScheduleSummary({ mode, purpose, date, time, memo });
  const capture = await store.createCapture(summary);
  const item: ConfirmItem = {
    sourceText: summary,
    assignedTo: 'my_action',
    orderIndex: 0,
    userSelectedCardType: PURPOSE_CARD_TYPES[purpose],
  };
  const result = await store.confirm({ ...capture, items: [item] });

  return NextResponse.json({
    redirectTo: '/home',
    createdCardCount: result.createdCardCount,
    summary,
  });
}

function normalizeMode(value: unknown): ScheduleMode | null {
  return value === 'add' || value === 'change' || value === 'cancel' ? value : null;
}

function normalizePurpose(value: unknown): SchedulePurpose | null {
  return value === 'visit' || value === 'injection' || value === 'test' || value === 'procedure' || value === 'other' ? value : null;
}

function normalizeDate(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/u.test(trimmed) ? trimmed : '';
}

function normalizeTime(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/u.test(trimmed) ? trimmed : '';
}

function normalizeMemo(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function buildScheduleSummary(input: { mode: ScheduleMode; purpose: SchedulePurpose; date: string; time: string; memo: string }) {
  const modeLabel = input.mode === 'cancel' ? '일정 취소 확정' : input.mode === 'change' ? '일정 변경 확정' : '일정 추가 확정';
  const base = `${modeLabel}: ${input.date} ${input.time} ${PURPOSE_LABELS[input.purpose]}`;
  return input.memo ? `${base} — ${input.memo}` : base;
}
