import { NextResponse, type NextRequest } from 'next/server';
import { buildClinicGuideFallbackResponse, isClinicGuideStep, normalizeClinicGuideResponse } from '../../../../src/domain/clinic-guide-interview';
import { requireSupabasePublicConfig } from '../../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import type { ClinicGuideRequest } from '../../../../src/types/clinic-guide.types';
import type { ClinicUpdate } from '../../../../src/types/slc.types';

const EDGE_TIMEOUT_MS = 4_000;

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
  const step = isClinicGuideStep(body.step) ? body.step : null;
  if (!step) return NextResponse.json({ error: 'step is required' }, { status: 400 });
  if (!userInput) return NextResponse.json({ error: 'userInput is required' }, { status: 400 });

  const clinicGuideRequest: ClinicGuideRequest = {
    patientId: user.id,
    step,
    context: normalizeContext(body.context),
    userInput,
    answerHistory: normalizeAnswerHistory(body.answerHistory),
  };

  let config: ReturnType<typeof requireSupabasePublicConfig>;
  try {
    config = requireSupabasePublicConfig();
  } catch {
    return NextResponse.json(buildClinicGuideFallbackResponse(clinicGuideRequest, 'edge_config_missing'));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS);
  try {
    const edgeResponse = await fetch(`${config.url}/functions/v1/clinic-guide-ai`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: config.anonKey,
        authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({ mode: 'interview', ...clinicGuideRequest }),
      signal: controller.signal,
    });
    if (!edgeResponse.ok) return NextResponse.json(buildClinicGuideFallbackResponse(clinicGuideRequest, 'edge_unavailable'));
    const payload = await edgeResponse.json().catch(() => null) as unknown;
    return NextResponse.json(normalizeClinicGuideResponse(payload, clinicGuideRequest));
  } catch {
    return NextResponse.json(buildClinicGuideFallbackResponse(clinicGuideRequest, 'edge_timeout_or_network'));
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAnswerHistory(value: unknown): ClinicGuideRequest['answerHistory'] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const step = isClinicGuideStep(record.step) ? record.step : null;
      const answer = typeof record.answer === 'string' ? record.answer.trim() : '';
      return step && answer ? { step, answer } : null;
    })
    .filter((item): item is ClinicGuideRequest['answerHistory'][number] => item !== null)
    .slice(-8);
}

function normalizeContext(value: unknown): Partial<ClinicUpdate> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    same_medication: typeof record.same_medication === 'boolean' ? record.same_medication : record.same_medication === null ? null : undefined,
    added_medication_ids: Array.isArray(record.added_medication_ids) ? record.added_medication_ids.filter((item): item is string => typeof item === 'string') : undefined,
    medication_days: typeof record.medication_days === 'number' && Number.isFinite(record.medication_days) ? record.medication_days : record.medication_days === null ? null : undefined,
    next_visit_at: typeof record.next_visit_at === 'string' ? record.next_visit_at : record.next_visit_at === null ? null : undefined,
    trigger_plan: record.trigger_plan === 'today' || record.trigger_plan === 'tomorrow' || record.trigger_plan === 'not_yet' || record.trigger_plan === 'unknown' || record.trigger_plan === null ? record.trigger_plan : undefined,
    memo: typeof record.memo === 'string' ? record.memo : record.memo === null ? null : undefined,
  };
}
