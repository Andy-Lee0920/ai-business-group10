declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type Medication = {
  id: string;
  brand_name_ko: string;
  brand_name_en: string | null;
  aliases: string[];
  category: 'stimulation' | 'suppression' | 'trigger' | 'luteal_support' | 'other';
  route: 'subcutaneous_injection' | 'intramuscular_injection' | 'oral' | 'vaginal' | 'other';
  default_unit: string;
  default_cta: '주사하기' | '복용하기' | '사용하기';
  patient_label: string;
  time_criticality: 'normal' | 'high' | 'critical';
  is_slc_seed: boolean;
};

type ClinicGuideStep = 'same_medication' | 'add_medication' | 'medication_days' | 'next_visit' | 'trigger_plan' | 'memo';
type TriggerPlan = 'today' | 'tomorrow' | 'not_yet' | 'unknown';
type ClinicGuideDraft = {
  same_medication?: boolean | null;
  added_medication_ids?: string[];
  medication_days?: number | null;
  next_visit_at?: string | null;
  trigger_plan?: TriggerPlan | null;
  memo?: string | null;
};

type NormalizeRequest = { mode?: 'normalizeMedication'; userInput: string; patientId: string };
type ClinicGuideAnswer = { step: ClinicGuideStep; answer: string };
type InterviewRequest = { mode: 'interview'; patientId: string; step: ClinicGuideStep; context: ClinicGuideDraft; userInput: string; answerHistory: ClinicGuideAnswer[] };
type ClinicGuideAiRequest = NormalizeRequest | InterviewRequest;
type ClinicGuideNormalizeResponse = { matched: Medication | null; source: 'aliases' | 'llm' | 'none' };
type ClinicGuideInterviewResponse = {
  nextStep: ClinicGuideStep | null;
  question: string;
  chips?: string[];
  draft: ClinicGuideDraft;
  warnings?: string[];
  fallbackReason?: string;
  requiresUserConfirmation: true;
};

type OpenRouterChoice = { message?: { content?: string } };
type OpenRouterResponse = { choices?: OpenRouterChoice[] };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await request.json().catch(() => ({})) as Partial<ClinicGuideAiRequest>;
  if (body.mode === 'interview') return handleInterview(body as Partial<InterviewRequest>);
  return handleNormalize(body as Partial<NormalizeRequest>);
});

async function handleNormalize(body: Partial<NormalizeRequest>) {
  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
  if (!userInput || !patientId) return json({ matched: null, source: 'none' }, 400);

  const medications = await fetchMedications();
  const aliasMatch = findAliasMatch(medications, userInput);
  if (aliasMatch) return json({ matched: aliasMatch, source: 'aliases' });

  const llmMatch = await matchMedicationWithOpenRouter(userInput, medications);
  if (llmMatch) return json({ matched: llmMatch, source: 'llm' });

  return json({ matched: null, source: 'none' });
}

async function handleInterview(body: Partial<InterviewRequest>) {
  const request = normalizeInterviewRequest(body);
  if (!request) return json({ error: 'invalid_interview_request' }, 400);
  const aiResponse = await interviewWithOpenRouter(request);
  return json(aiResponse ?? buildInterviewFallback(request, 'deterministic_fallback'));
}

function json(payload: ClinicGuideNormalizeResponse | ClinicGuideInterviewResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

async function fetchMedications(): Promise<Medication[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseKey) return [];

  const response = await fetch(`${supabaseUrl}/rest/v1/medications?select=*&is_slc_seed=eq.true`, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!response.ok) return [];
  return await response.json() as Medication[];
}

function findAliasMatch(medications: Medication[], userInput: string) {
  const normalizedInput = normalizeMedicationText(userInput);
  if (!normalizedInput) return null;

  return medications.find((medication) => {
    const candidates = [medication.brand_name_ko, medication.brand_name_en, ...medication.aliases]
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalizeMedicationText);
    return candidates.some((candidate) => candidate.length > 0 && (normalizedInput.includes(candidate) || candidate.includes(normalizedInput)));
  }) ?? null;
}

async function matchMedicationWithOpenRouter(userInput: string, medications: Medication[]) {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey || medications.length === 0) return null;

  const catalog = medications.map((medication) => ({
    id: medication.id,
    brand_name_ko: medication.brand_name_ko,
    brand_name_en: medication.brand_name_en,
    aliases: medication.aliases,
  }));

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'Normalize only IVF medication names to one provided medication id. Do not infer dose, timing, treatment stage, or medical advice. Return JSON only: {"id": string | null}.',
        },
        { role: 'user', content: JSON.stringify({ userInput, medications: catalog }) },
      ],
      temperature: 0,
    }),
  });
  if (!response.ok) return null;

  const data = await response.json() as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content ?? '';
  const id = parseMedicationId(content);
  return id ? medications.find((medication) => medication.id === id) ?? null : null;
}

async function interviewWithOpenRouter(request: InterviewRequest): Promise<ClinicGuideInterviewResponse | null> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) return null;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'You help Korean IVF patients summarize only facts they report after a clinic visit. Ask exactly one next question. Do not provide medical advice, dosing recommendations, treatment-stage judgment, or automatic saving. Return JSON only with nextStep, question, chips, draft, warnings, requiresUserConfirmation:true.',
        },
        { role: 'user', content: JSON.stringify(request) },
      ],
      temperature: 0.2,
    }),
  }).catch(() => null);
  if (!response?.ok) return null;
  const data = await response.json().catch(() => null) as OpenRouterResponse | null;
  const content = data?.choices?.[0]?.message?.content ?? '';
  return parseInterviewResponse(content, request);
}

function parseMedicationId(content: string) {
  try {
    const parsed = JSON.parse(content) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id : null;
  } catch {
    return null;
  }
}

function parseInterviewResponse(content: string, request: InterviewRequest): ClinicGuideInterviewResponse | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const question = typeof parsed.question === 'string' && parsed.question.trim() ? parsed.question.trim() : null;
    if (!question || !containsKorean(question)) return null;
    const draft = isRecord(parsed.draft) ? normalizeDraft({ ...request.context, ...inferDraft(request.step, request.userInput), ...parsed.draft }) : normalizeDraft({ ...request.context, ...inferDraft(request.step, request.userInput) });
    return {
      nextStep: isClinicGuideStep(parsed.nextStep) ? parsed.nextStep : parsed.nextStep === null ? null : resolveNextStep(request.step, draft),
      question,
      chips: normalizeStringArray(parsed.chips),
      draft,
      warnings: normalizeStringArray(parsed.warnings),
      requiresUserConfirmation: true,
    };
  } catch {
    return null;
  }
}

function normalizeInterviewRequest(body: Partial<InterviewRequest>): InterviewRequest | null {
  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
  if (!patientId || !userInput || !isClinicGuideStep(body.step)) return null;
  return {
    mode: 'interview',
    patientId,
    step: body.step,
    context: isRecord(body.context) ? normalizeDraft(body.context) : {},
    userInput,
    answerHistory: normalizeAnswerHistory(body.answerHistory),
  };
}


function normalizeAnswerHistory(value: unknown): ClinicGuideAnswer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const step = isClinicGuideStep(item.step) ? item.step : null;
      const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
      return step && answer ? { step, answer } : null;
    })
    .filter((item): item is ClinicGuideAnswer => item !== null)
    .slice(-8);
}

function buildInterviewFallback(request: InterviewRequest, fallbackReason: string): ClinicGuideInterviewResponse {
  const draft = normalizeDraft({ ...request.context, ...inferDraft(request.step, request.userInput) });
  const nextStep = resolveNextStep(request.step, draft);
  return {
    nextStep,
    question: nextStep ? fallbackQuestion(nextStep) : '정리된 내용을 저장 전에 확인해 주세요.',
    chips: nextStep ? fallbackChips(nextStep) : ['저장 전 확인'],
    draft,
    warnings: ['의학적 판단 없이 입력한 사실만 정리했어요. 저장 전 병원 안내와 다시 확인해 주세요.'],
    fallbackReason,
    requiresUserConfirmation: true,
  };
}

function inferDraft(step: ClinicGuideStep, userInput: string): ClinicGuideDraft {
  const normalized = userInput.trim().toLocaleLowerCase('ko-KR');
  if (step === 'same_medication') {
    if (/(바뀌|변경|새|추가|changed|change)/u.test(normalized)) return { same_medication: false };
    if (/(그대로|같|same|유지|없)/u.test(normalized)) return { same_medication: true };
    return { same_medication: null };
  }
  if (step === 'medication_days') return { medication_days: parsePositiveInteger(normalized) };
  if (step === 'next_visit') return { next_visit_at: parseDateLike(userInput) };
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

function resolveNextStep(step: ClinicGuideStep, draft: ClinicGuideDraft): ClinicGuideStep | null {
  if (step === 'same_medication') return draft.same_medication === false ? 'add_medication' : 'medication_days';
  if (step === 'add_medication') return 'medication_days';
  if (step === 'medication_days') return 'next_visit';
  if (step === 'next_visit') return 'trigger_plan';
  if (step === 'trigger_plan') return 'memo';
  return null;
}

function fallbackQuestion(step: ClinicGuideStep) {
  if (step === 'add_medication') return '새로 받은 약이 있다면 이름만 적어주세요. 없으면 없다고 답해도 괜찮아요.';
  if (step === 'medication_days') return '며칠치 처방을 받았나요?';
  if (step === 'next_visit') return '다음 방문일을 들었다면 날짜를 알려주세요.';
  if (step === 'trigger_plan') return '트리거 주사 계획을 들었나요?';
  if (step === 'memo') return '마지막으로 병원에서 들은 내용을 그대로 메모해 주세요.';
  return '오늘 병원에서 약이 그대로인지, 바뀌었는지만 먼저 확인할게요.';
}

function fallbackChips(step: ClinicGuideStep) {
  if (step === 'same_medication') return ['그대로예요', '바뀌었어요', '잘 모르겠어요'];
  if (step === 'add_medication') return ['새 약 있어요', '없어요', '직접 입력할게요'];
  if (step === 'medication_days') return ['1일', '2일', '3일', '직접 입력'];
  if (step === 'next_visit') return ['처방일 기준으로 제안', '날짜 직접 선택', '아직 몰라요'];
  if (step === 'trigger_plan') return ['오늘', '내일', '아직 미정', '잘 모르겠어요'];
  return ['메모 없음', '저장 전 확인할게요'];
}

function normalizeDraft(raw: Record<string, unknown>): ClinicGuideDraft {
  return {
    same_medication: typeof raw.same_medication === 'boolean' ? raw.same_medication : raw.same_medication === null ? null : undefined,
    added_medication_ids: normalizeStringArray(raw.added_medication_ids),
    medication_days: typeof raw.medication_days === 'number' && Number.isFinite(raw.medication_days) ? Math.max(1, Math.min(30, Math.trunc(raw.medication_days))) : raw.medication_days === null ? null : undefined,
    next_visit_at: typeof raw.next_visit_at === 'string' && raw.next_visit_at.trim() ? raw.next_visit_at.trim() : raw.next_visit_at === null ? null : undefined,
    trigger_plan: raw.trigger_plan === 'today' || raw.trigger_plan === 'tomorrow' || raw.trigger_plan === 'not_yet' || raw.trigger_plan === 'unknown' || raw.trigger_plan === null ? raw.trigger_plan : undefined,
    memo: typeof raw.memo === 'string' && raw.memo.trim() ? raw.memo.trim() : raw.memo === null ? null : undefined,
  };
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

function isClinicGuideStep(value: unknown): value is ClinicGuideStep {
  return value === 'same_medication' || value === 'add_medication' || value === 'medication_days' || value === 'next_visit' || value === 'trigger_plan' || value === 'memo';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeMedicationText(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s\-_()]/gu, '');
}
