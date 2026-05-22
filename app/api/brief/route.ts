import { NextResponse } from 'next/server';
import { generateDailyBrief } from '../../../src/lib/brief/generateBrief';
import { factDict } from '../../../src/lib/brief/factDict';
import type { BriefPhase } from '../../../src/lib/brief/types';
import type { TimelineCareDay } from '../../../src/types/treatment-timeline.types';

const PHASE_CARE_DAYS = ['clinic_day', 'injection_day', 'waiting_day', 'two_week_wait_day', 'result_protection_day', 'routine_day', 'onboarding'] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as BriefRequestBody | null;
  if (!body || !isBriefPhase(body.confirmedPhase) || !isPhaseCareDay(body.phaseCareDay)) {
    return NextResponse.json({ error: 'invalid_brief_input' }, { status: 400 });
  }

  const result = await generateDailyBrief({
    confirmedPhase: body.confirmedPhase,
    phaseCareDay: body.phaseCareDay,
    dayIndexInPhase: typeof body.dayIndexInPhase === 'number' && Number.isFinite(body.dayIndexInPhase) ? body.dayIndexInPhase : 0,
    facts: factDict[body.confirmedPhase],
    recentCriticalEventTypes: Array.isArray(body.recentCriticalEventTypes) ? body.recentCriticalEventTypes : [],
  });

  return NextResponse.json(result, { headers: { 'cache-control': 'no-store' } });
}

type BriefRequestBody = {
  confirmedPhase?: unknown;
  phaseCareDay?: unknown;
  dayIndexInPhase?: number;
  recentCriticalEventTypes?: string[];
};

function isBriefPhase(value: unknown): value is BriefPhase {
  return typeof value === 'string' && value in factDict;
}

function isPhaseCareDay(value: unknown): value is TimelineCareDay | 'onboarding' {
  return typeof value === 'string' && PHASE_CARE_DAYS.includes(value as TimelineCareDay | 'onboarding');
}
