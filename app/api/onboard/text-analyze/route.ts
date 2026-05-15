import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isPresentationRequest } from '../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';
import type { ScheduleType } from '../../../../src/types/slc.types';

type DbError = { message: string };
type ExtractedCandidate = {
  type: string;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
};
type InsertedCandidate = ExtractedCandidate & { id: string };
type TextAnalyzeBody = { rawText?: unknown };
type OnboardAnalyzeClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  functions: {
    invoke(name: 'schedule-extract', options: { body: { mode: 'text'; rawText: string; patientId: string } }): Promise<{ data: { candidates?: ExtractedCandidate[] } | null; error: DbError | null }>;
  };
  from(table: 'schedule_candidates'): {
    insert(rows: Array<Record<string, unknown>>): { select(): Promise<{ data: InsertedCandidate[] | null; error: DbError | null }> };
  };
};

export async function POST(request: NextRequest) {
  const supabase = (await createCookieBackedSupabaseClient()) as unknown as OnboardAnalyzeClient;
  const { data: { user } } = await supabase.auth.getUser();

  const body = (await request.json().catch(() => ({}))) as TextAnalyzeBody;
  const rawText = normalizeText(body.rawText);
  if (!rawText) return NextResponse.json({ error: 'rawText is required' }, { status: 400 });

  if (!user && isPresentationRequest(request)) {
    if (!hasPrivacyGateCookie(request.headers.get('cookie'))) {
      return NextResponse.json({ error: 'privacy_gate_required' }, { status: 403 });
    }

    const { data } = await supabase.functions.invoke('schedule-extract', {
      body: { mode: 'text', rawText, patientId: 'presentation' },
    });
    const candidates = normalizeCandidates(data?.candidates);
    const safeCandidates = chooseSafeTextCandidates(rawText, candidates);
    return NextResponse.json({ candidates: withPresentationIds(safeCandidates) });
  }

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase.functions.invoke('schedule-extract', {
    body: { mode: 'text', rawText, patientId: user.id },
  });

  const candidates = normalizeCandidates(data?.candidates);
  const safeCandidates = chooseSafeTextCandidates(rawText, candidates);
  if (safeCandidates.length === 0) return NextResponse.json({ candidates: [] });

  const rows = safeCandidates.map((candidate) => ({
    patient_id: user.id,
    image_path: null,
    raw_text: rawText,
    status: 'draft',
    type: candidate.type,
    title: candidate.title,
    scheduled_at: candidate.scheduled_at,
    dose: candidate.dose,
    unit: candidate.unit,
  }));

  const { data: inserted, error } = await supabase.from('schedule_candidates').insert(rows).select();
  if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });

  return NextResponse.json({ candidates: inserted ?? [] });
}


function hasPrivacyGateCookie(cookieHeader: string | null) {
  return cookieHeader?.split(';').some((part) => {
    const trimmed = part.trim();
    return trimmed === 'fevio_privacy_gate_v1=accepted' || trimmed === 'fevio_privacy_accepted=1';
  }) ?? false;
}

function withPresentationIds(candidates: ExtractedCandidate[]): InsertedCandidate[] {
  return candidates.map((candidate) => ({ id: `presentation-${randomUUID()}`, ...candidate }));
}

function chooseSafeTextCandidates(rawText: string, llmCandidates: ExtractedCandidate[]) {
  const deterministicCandidates = extractDeterministicTextCandidates(rawText);
  return deterministicCandidates.length ? deterministicCandidates : llmCandidates;
}

const KOREA_TIME_ZONE = 'Asia/Seoul';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DETERMINISTIC_CANDIDATES = 30;

const INJECTION_MEDICATION_ALIASES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /고날\s*(?:에프|f)?/iu, title: '고날에프' },
  { pattern: /세트로\s*(?:타이드)?/iu, title: '세트로타이드' },
  { pattern: /오비드렐/iu, title: '오비드렐' },
  { pattern: /퓨리곤/iu, title: '퓨리곤' },
  { pattern: /메노푸르/iu, title: '메노푸르' },
  { pattern: /프로게스테론|질정/iu, title: '프로게스테론' },
];

function extractDeterministicTextCandidates(rawText: string, now = new Date()): ExtractedCandidate[] {
  const title = findScheduleTitle(rawText);
  if (!title) return [];

  const type = inferTextScheduleType(rawText, title);
  if (!type) return [];

  const durationDays = extractDurationDays(rawText);
  const times = extractExplicitTimes(rawText);
  const frequency = extractDailyFrequency(rawText, times.length);
  const shouldExpandDuration = shouldExpandDurationFrequency(rawText, durationDays, frequency, times.length);
  const dose = extractDose(rawText);
  const unit = dose ? extractDoseUnit(rawText) : null;
  const startDateKey = getStartKoreanDateKey(now, rawText);

  if (!times.length) {
    const candidateCount = shouldExpandDuration ? durationDays * frequency : frequency;
    return Array.from({ length: candidateCount })
      .slice(0, MAX_DETERMINISTIC_CANDIDATES)
      .map((_, index) => ({
        type,
        title: formatExpandedTitle(title, index, frequency, candidateCount),
        scheduled_at: null,
        dose,
        unit,
      }));
  }

  const expandedDates = shouldExpandDuration ? Array.from({ length: durationDays }, (_, index) => addDaysToKoreanDateKey(startDateKey, index)) : [startDateKey];
  return expandedDates
    .flatMap((dateKey) => times.map((time) => ({
      type,
      title,
      scheduled_at: toKoreanIso(dateKey, time.hour, time.minute),
      dose,
      unit,
    })))
    .slice(0, MAX_DETERMINISTIC_CANDIDATES);
}

function findScheduleTitle(rawText: string) {
  const medicationTitle = INJECTION_MEDICATION_ALIASES.find((alias) => alias.pattern.test(rawText))?.title;
  if (medicationTitle) return medicationTitle;
  if (/주사|맞|펜/iu.test(rawText)) return '주사';
  return null;
}

function inferTextScheduleType(rawText: string, title: string): ScheduleType | null {
  if (/주사|맞|펜|IU|고날|세트로|오비드렐|퓨리곤|메노푸르/iu.test(rawText)) return 'injection';
  if (/복용|먹|질정|정\b/iu.test(rawText) && title === '프로게스테론') return 'medication';
  if (/방문|내원|검사|초음파|채혈/iu.test(rawText)) return 'clinic';
  return null;
}

function extractDurationDays(rawText: string) {
  const match = rawText.match(/(\d{1,2})\s*일\s*간/u);
  const days = Number.parseInt(match?.[1] ?? '1', 10);
  if (!Number.isInteger(days) || days < 1) return 1;
  return Math.min(days, 14);
}

function extractDailyFrequency(rawText: string, explicitTimeCount: number) {
  if (/하루\s*(?:두|2)\s*번|하루\s*(?:두|2)\s*회/iu.test(rawText)) return 2;
  if (/아침/u.test(rawText) && /저녁|밤/u.test(rawText)) return 2;

  const dailyMatch = rawText.match(/하루\s*(\d{1,2})\s*(?:번|회)/u);
  if (dailyMatch) {
    const frequency = Number.parseInt(dailyMatch[1] ?? '1', 10);
    if (Number.isInteger(frequency) && frequency > 0) return Math.min(frequency, 6);
  }

  const onceMatch = rawText.match(/(\d{1,2})\s*회/u);
  if (onceMatch) {
    const frequency = Number.parseInt(onceMatch[1] ?? '1', 10);
    if (Number.isInteger(frequency) && frequency > 0) return Math.min(frequency, 6);
  }

  if (/매일/u.test(rawText) && explicitTimeCount > 0) return explicitTimeCount;
  return Math.max(explicitTimeCount, 1);
}

function shouldExpandDurationFrequency(rawText: string, durationDays: number, frequency: number, explicitTimeCount: number) {
  if (durationDays <= 1) return false;
  if (/하루\s*(?:\d{1,2}|두)\s*(?:번|회)/iu.test(rawText)) return true;
  if (/매일/u.test(rawText)) return true;
  return explicitTimeCount === 0 && frequency > 1 && (/아침/u.test(rawText) || /저녁|밤/u.test(rawText));
}

function formatExpandedTitle(title: string, index: number, frequency: number, candidateCount: number) {
  if (candidateCount <= 1) return title;
  const day = Math.floor(index / frequency) + 1;
  const round = (index % frequency) + 1;
  return `${title} ${day}일차 ${round}회차`;
}

function extractExplicitTimes(rawText: string): Array<{ hour: number; minute: number }> {
  const times: Array<{ hour: number; minute: number }> = [];
  const seen = new Set<string>();
  const timePattern = /(?:(오전|오후|밤|저녁|아침)\s*)?(\d{1,2})(?::(\d{2}))?\s*시/giu;

  for (const match of rawText.matchAll(timePattern)) {
    const hour = normalizeHour(Number.parseInt(match[2] ?? '', 10), match[1] ?? '');
    const minute = Number.parseInt(match[3] ?? '0', 10);
    if (hour === null || !Number.isInteger(minute) || minute < 0 || minute > 59) continue;
    const key = `${hour}:${minute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    times.push({ hour, minute });
  }

  const clockPattern = /\b([01]?\d|2[0-3]):([0-5]\d)\b/gu;
  for (const match of rawText.matchAll(clockPattern)) {
    const hour = Number.parseInt(match[1] ?? '', 10);
    const minute = Number.parseInt(match[2] ?? '', 10);
    const key = `${hour}:${minute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    times.push({ hour, minute });
  }

  return times;
}

function normalizeHour(hour: number, meridiem: string) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 24) return null;
  if (hour === 24) return 0;
  if ((meridiem === '오후' || meridiem === '저녁' || meridiem === '밤') && hour >= 1 && hour <= 11) return hour + 12;
  if (meridiem === '아침' && hour === 12) return 0;
  return hour;
}

function getKoreanDateKey(now: Date, offsetDays: number) {
  const target = new Date(now.getTime() + (offsetDays * DAY_MS));
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(target);
  const value = (type: 'year' | 'month' | 'day') => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function getStartKoreanDateKey(now: Date, rawText: string) {
  const explicitDateKey = extractExplicitKoreanDateKey(now, rawText);
  if (explicitDateKey) return explicitDateKey;
  return getKoreanDateKey(now, rawText.includes('내일') ? 1 : 0);
}

function extractExplicitKoreanDateKey(now: Date, rawText: string) {
  const match = rawText.match(/(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일/u);
  if (!match) return null;

  const currentYear = Number.parseInt(getKoreanDateKey(now, 0).slice(0, 4), 10);
  const year = Number.parseInt(match[1] ?? String(currentYear), 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysToKoreanDateKey(dateKey: string, offsetDays: number) {
  const target = new Date(new Date(`${dateKey}T00:00:00+09:00`).getTime() + (offsetDays * DAY_MS));
  return getKoreanDateKey(target, 0);
}

function toKoreanIso(dateKey: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return new Date(`${dateKey}T${hh}:${mm}:00+09:00`).toISOString();
}

function extractDose(rawText: string) {
  return rawText.match(/\b(\d+(?:\.\d+)?)\s*(?:IU|iu|mg|mcg|mL|ml|정)\b/u)?.[1] ?? null;
}

function extractDoseUnit(rawText: string) {
  const match = rawText.match(/\b\d+(?:\.\d+)?\s*(IU|iu|mg|mcg|mL|ml|정)\b/u);
  return match?.[1]?.replace(/iu/u, 'IU') ?? null;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCandidates(value: unknown): ExtractedCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCandidate).filter((candidate): candidate is ExtractedCandidate => candidate !== null);
}

function normalizeCandidate(value: unknown): ExtractedCandidate | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const type = normalizeScheduleType(candidate.type);
  const title = normalizeText(candidate.title);
  if (!type || !title) return null;
  return {
    type,
    title,
    scheduled_at: normalizeNullableIso(candidate.scheduled_at),
    dose: normalizeNullableText(candidate.dose),
    unit: normalizeNullableText(candidate.unit),
  };
}

function normalizeScheduleType(value: unknown): ScheduleType | null {
  return value === 'injection' || value === 'medication' || value === 'clinic' ? value : null;
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeNullableIso(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
