import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../../src/lib/slc-fallback';
import type { ScheduleType } from '../../../../src/types/slc.types';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';

type ScheduleAddBody = {
  type: ScheduleType;
  title: string;
  dose?: string | null;
  unit?: string | null;
  scheduledAt?: string;
  startDate?: string;
  endDate?: string;
  dailyTime?: string;
  medicationId?: string | null;
};

type ScheduleInsertRow = {
  patient_id: string;
  type: ScheduleType;
  title: string;
  dose: string | null;
  unit: string | null;
  scheduled_at: string;
  medication_id: string | null;
  source: 'manual';
};

const MAX_RANGE_DAYS = 30;
const ONE_DAY_MS = 86_400_000;

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isTimeOnly(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function dateOnlyFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function kstDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

function rangeDates(startDate: string, endDate: string): string[] | null {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return null;
  const diffDays = Math.floor((end.getTime() - start.getTime()) / ONE_DAY_MS) + 1;
  if (diffDays < 1) return null;
  if (diffDays > MAX_RANGE_DAYS) return [];

  return Array.from({ length: diffDays }, (_, index) => dateOnlyFromUtc(new Date(start.getTime() + index * ONE_DAY_MS)));
}

function baseRow(body: ScheduleAddBody, userId: string, scheduledAt: string): ScheduleInsertRow {
  return {
    patient_id: userId,
    type: body.type,
    title: body.title,
    dose: body.dose ?? null,
    unit: body.unit ?? null,
    scheduled_at: scheduledAt,
    medication_id: body.medicationId ?? null,
    source: 'manual',
  };
}

function isRangeRequest(body: ScheduleAddBody): body is ScheduleAddBody & { startDate: string; endDate: string; dailyTime: string } {
  return Boolean(body.startDate || body.endDate || body.dailyTime);
}

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as ScheduleAddBody;

  if (isRangeRequest(body)) {
    if (!body.startDate || !body.endDate || !body.dailyTime || !isTimeOnly(body.dailyTime)) {
      return NextResponse.json({ error: '기간과 시간을 다시 확인해 주세요.' }, { status: 400 });
    }

    const dates = rangeDates(body.startDate, body.endDate);
    if (dates === null) {
      return NextResponse.json({ error: '기간과 시간을 다시 확인해 주세요.' }, { status: 400 });
    }
    if (dates.length === 0) {
      return NextResponse.json({ error: '기간 반복은 최대 30일까지 저장할 수 있어요.' }, { status: 400 });
    }

    const rows = dates.map((date) => baseRow(body, user.id, kstDateTimeToIso(date, body.dailyTime)));
    const { error, data } = await supabase
      .from('schedule_items')
      .insert(rows)
      .select();

    if (error) {
      if (isMissingSlcTable(error)) {
        return NextResponse.json({ items: rows.map((row, index) => ({ id: `fallback-${Date.now()}-${index}`, status: 'upcoming', ...row })), fallback: 'missing_slc_schema' });
      }
      return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
    }
    return NextResponse.json({ items: data });
  }

  if (!body.scheduledAt) {
    return NextResponse.json({ error: '일정 시간을 다시 확인해 주세요.' }, { status: 400 });
  }

  const row = baseRow(body, user.id, body.scheduledAt);
  const { error, data } = await supabase
    .from('schedule_items')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (isMissingSlcTable(error)) {
      return NextResponse.json({ item: { id: `fallback-${Date.now()}`, status: 'upcoming', ...row }, fallback: 'missing_slc_schema' });
    }
    return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}
