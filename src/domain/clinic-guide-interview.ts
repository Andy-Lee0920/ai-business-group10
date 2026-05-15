import type { ClinicUpdate } from '../types/slc.types';
import type { ClinicGuideRequest, ClinicGuideResponse, ClinicGuideStep } from '../types/clinic-guide.types';

const CLINIC_GUIDE_STEPS = ['same_medication', 'add_medication', 'medication_days', 'next_visit', 'trigger_plan', 'memo'] as const satisfies readonly ClinicGuideStep[];

const FALLBACK_QUESTIONS: Record<ClinicGuideStep, string> = {
  same_medication: '오늘 병원에서 약이 그대로인지, 바뀌었는지만 먼저 확인할게요.',
  add_medication: '새로 받은 약이 있다면 이름만 적어주세요. 없으면 없다고 답해도 괜찮아요.',
  medication_days: '며칠치 처방을 받았나요?',
  next_visit: '다음 방문일을 들었다면 날짜를 알려주세요.',
  trigger_plan: '트리거 주사 계획을 들었나요? 오늘, 내일, 아직 미정 중에서 확인해 주세요.',
  memo: '마지막으로 병원에서 들은 내용을 그대로 메모해 주세요.',
};

const FALLBACK_CHIPS: Record<ClinicGuideStep, string[]> = {
  same_medication: ['그대로예요', '바뀌었어요', '잘 모르겠어요'],
  add_medication: ['새 약 있어요', '없어요', '직접 입력할게요'],
  medication_days: ['1일', '2일', '3일', '직접 입력'],
  next_visit: ['처방일 기준으로 제안', '날짜 직접 선택', '아직 몰라요'],
  trigger_plan: ['오늘', '내일', '아직 미정', '잘 모르겠어요'],
  memo: ['메모 없음', '저장 전 확인할게요'],
};

export function isClinicGuideStep(value: unknown): value is ClinicGuideStep {
  return typeof value === 'string' && CLINIC_GUIDE_STEPS.includes(value as ClinicGuideStep);
}

export function buildClinicGuideFallbackResponse(request: ClinicGuideRequest, fallbackReason = 'deterministic_fallback'): ClinicGuideResponse {
  const draft = mergeDraft(request.context, inferDraft(request.step, request.userInput));
  const nextStep = resolveNextStep(request.step, request.userInput, draft);
  return {
    nextStep,
    question: nextStep ? FALLBACK_QUESTIONS[nextStep] : '정리된 내용을 저장 전에 확인해 주세요.',
    chips: nextStep ? FALLBACK_CHIPS[nextStep] : ['저장 전 확인'],
    draft,
    warnings: ['의학적 판단 없이 입력한 사실만 정리했어요. 저장 전 병원 안내와 다시 확인해 주세요.'],
    fallbackReason,
    requiresUserConfirmation: true,
  };
}

export function normalizeClinicGuideResponse(payload: unknown, request: ClinicGuideRequest, fallbackReason = 'malformed_edge_response'): ClinicGuideResponse {
  if (!isRecord(payload)) return buildClinicGuideFallbackResponse(request, fallbackReason);
  const question = typeof payload.question === 'string' && payload.question.trim() ? payload.question.trim() : null;
  const draft = isRecord(payload.draft) ? mergeDraft(mergeDraft(request.context, inferDraft(request.step, request.userInput)), normalizeDraft(payload.draft)) : null;
  if (!question || !containsKorean(question) || !draft) return buildClinicGuideFallbackResponse(request, fallbackReason);

  const rawNextStep = payload.nextStep;
  const nextStep = rawNextStep === null || rawNextStep === undefined ? null : isClinicGuideStep(rawNextStep) ? rawNextStep : resolveNextStep(request.step, request.userInput, draft);
  return {
    nextStep,
    question,
    chips: normalizeStringArray(payload.chips),
    draft,
    warnings: normalizeStringArray(payload.warnings),
    fallbackReason: typeof payload.fallbackReason === 'string' ? payload.fallbackReason : undefined,
    requiresUserConfirmation: true,
  };
}

function resolveNextStep(step: ClinicGuideStep, userInput: string, draft: Partial<ClinicUpdate>): ClinicGuideStep | null {
  if (step === 'same_medication') return draft.same_medication === false ? 'add_medication' : 'medication_days';
  if (step === 'add_medication') return 'medication_days';
  if (step === 'medication_days') return 'next_visit';
  if (step === 'next_visit') return 'trigger_plan';
  if (step === 'trigger_plan') return 'memo';
  if (step === 'memo') return null;
  return userInput.trim() ? 'memo' : null;
}

function inferDraft(step: ClinicGuideStep, userInput: string): Partial<ClinicUpdate> {
  const normalized = userInput.trim().toLocaleLowerCase('ko-KR');
  if (step === 'same_medication') {
    if (/(바뀌|변경|새|추가|changed|change)/u.test(normalized)) return { same_medication: false };
    if (/(그대로|같|same|유지|없)/u.test(normalized)) return { same_medication: true };
    return { same_medication: null };
  }
  if (step === 'medication_days') {
    const days = parsePositiveInteger(normalized);
    return { medication_days: days };
  }
  if (step === 'next_visit') {
    return { next_visit_at: parseDateLike(userInput) };
  }
  if (step === 'trigger_plan') {
    if (normalized.includes('오늘')) return { trigger_plan: 'today' };
    if (normalized.includes('내일')) return { trigger_plan: 'tomorrow' };
    if (/(미정|아직|not yet)/u.test(normalized)) return { trigger_plan: 'not_yet' };
    if (/(모르|unknown)/u.test(normalized)) return { trigger_plan: 'unknown' };
    return { trigger_plan: null };
  }
  if (step === 'memo') return { memo: userInput.trim() || null };
  return {};
}

function mergeDraft(base: Partial<ClinicUpdate>, patch: Partial<ClinicUpdate>): Partial<ClinicUpdate> {
  return normalizeDraft({ ...base, ...patch });
}

function normalizeDraft(raw: Record<string, unknown>): Partial<ClinicUpdate> {
  return {
    same_medication: normalizeNullableBoolean(raw.same_medication),
    added_medication_ids: normalizeStringArray(raw.added_medication_ids),
    medication_days: normalizeNullableNumber(raw.medication_days),
    next_visit_at: normalizeNullableString(raw.next_visit_at),
    trigger_plan: normalizeTriggerPlan(raw.trigger_plan),
    memo: normalizeNullableString(raw.memo),
  };
}

function normalizeNullableBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : value === null ? null : undefined;
}

function normalizeNullableNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value === null ? null : undefined;
  return Math.max(1, Math.min(30, Math.trunc(value)));
}

function normalizeNullableString(value: unknown) {
  if (value === null) return null;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeTriggerPlan(value: unknown): ClinicUpdate['trigger_plan'] | undefined {
  if (value === null) return null;
  return value === 'today' || value === 'tomorrow' || value === 'not_yet' || value === 'unknown' ? value : undefined;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : [];
}

function parsePositiveInteger(value: string) {
  const match = value.match(/\d+/u);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(30, parsed)) : null;
}

function parseDateLike(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/u.test(trimmed)) return trimmed.length === 10 ? `${trimmed}T09:00:00.000Z` : trimmed;
  return null;
}

function containsKorean(value: string) {
  return /[가-힣]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
