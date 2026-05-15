declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type ScheduleExtractRequest =
  | { mode: 'image'; imagePath: string; patientId: string; signedUrl?: string }
  | { mode: 'text'; rawText: string; patientId: string };

type ScheduleType = 'injection' | 'medication' | 'clinic';

type ScheduleCandidate = {
  type: ScheduleType;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
};

type ScheduleExtractResponse = { candidates: ScheduleCandidate[] };
type ErrorResponse = { error: string };
type OpenRouterChoice = { message?: { content?: string } };
type OpenRouterResponse = { choices?: OpenRouterChoice[] };
type StorageSignedUrlResponse = { signedURL?: string; signedUrl?: string; error?: string; message?: string };

const DEFAULT_OPENROUTER_SCHEDULE_MODEL = 'anthropic/claude-haiku-4.5';
const OPENROUTER_VISION_MODEL = Deno.env.get('OPENROUTER_VISION_MODEL') ?? DEFAULT_OPENROUTER_SCHEDULE_MODEL;
const OPENROUTER_TEXT_MODEL = Deno.env.get('OPENROUTER_TEXT_MODEL') ?? DEFAULT_OPENROUTER_SCHEDULE_MODEL;
const CLINIC_PHOTOS_BUCKET = 'clinic-photos';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 5;
const SCHEDULE_EXTRACT_SYSTEM_PROMPT = [
  '의료 판단 금지, 일정 후보만 추출.',
  'IVF 환자의 병원 안내에서 사용자가 저장 전 확인할 일정 후보만 JSON으로 추출한다.',
  '진단, 용량 판단, 치료 단계 판단, 복약/주사 권고를 하지 않는다.',
  '원문을 줄/항목 단위로 읽고 약명·방문 일정마다 별도 후보를 만든다.',
  '명시된 날짜와 시간이 있으면 scheduled_at을 null로 두지 말고 ISO-8601(+09:00 기준)로 채운다.',
  '예: 2026년 5월 15일 오후 9시 => 2026-05-15T21:00:00+09:00, 밤 10시 => 22:00, 오전 10시 방문 => clinic.',
  '문서 상단/환자정보의 발행일·작성일은 기준일이다. 오늘/오늘부터/오늘 밤부터는 그 기준일로 해석한다.',
  '기간과 빈도는 후보 수로 펼친다. 예: 3일간 하루 두 번 => 6 candidates, 2일간 매일 오전 9시 => 2 candidates.',
  '단, "본인이 정해서", "정확한 시간 확인", "확인 후 입력"처럼 사용자가 시간을 정해야 하는 항목은 scheduled_at:null로 둔다.',
  '시간 미정이어도 약명, 용량, 단위, 기간, 빈도는 원문에 있으면 반드시 채운다. 용량/단위가 제목에 보이면 dose/unit에도 분리해 채운다.',
  '고날에프, 메노푸어, 세트로타이드, 오비드렐, 퓨리곤은 원문에 복용이라고 쓰지 않는 한 injection으로 분류한다.',
  '오후/밤/저녁은 12시간을 더한다. 오후 9시는 21:00이지 09:00이 아니다.',
  '시간을 사용자가 정하라는 안내 문장 자체는 별도 candidate로 만들지 말고, 바로 앞 약명/행위 후보의 시간 미정 정보로만 반영한다.',
  'Return JSON only: {"candidates":[{"type":"injection"|"medication"|"clinic","title":string,"scheduled_at":string|null,"dose":string|null,"unit":string|null}]}',
].join(' ');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  if (body.mode === 'text') {
    const extractRequest = normalizeTextRequest(body);
    if (!extractRequest) return json({ error: 'invalid_text_request' }, 400);
    const candidates = await extractCandidatesFromTextWithOpenRouter(extractRequest.rawText);
    return json({ candidates });
  }

  if (body.mode !== 'image') return json({ error: 'unsupported_mode' }, 400);

  const extractRequest = normalizeImageRequest(body);
  if (!extractRequest) return json({ error: 'invalid_image_request' }, 400);

  const signedUrl = extractRequest.signedUrl ?? await createStorageSignedUrl(extractRequest.imagePath);
  if (!signedUrl) return json({ candidates: [] });

  const candidates = await extractCandidatesFromImageWithOpenRouter(signedUrl);
  return json({ candidates });
});

function json(payload: ScheduleExtractResponse | ErrorResponse, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function normalizeImageRequest(body: Record<string, unknown>): Extract<ScheduleExtractRequest, { mode: 'image' }> | null {
  const imagePath = typeof body.imagePath === 'string' ? body.imagePath.trim() : '';
  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
  const signedUrl = typeof body.signedUrl === 'string' && body.signedUrl.startsWith('http') ? body.signedUrl.trim() : undefined;
  if (!imagePath || !patientId) return null;
  return { mode: 'image', imagePath, patientId, signedUrl };
}

function normalizeTextRequest(body: Record<string, unknown>): Extract<ScheduleExtractRequest, { mode: 'text' }> | null {
  const rawText = typeof body.rawText === 'string' ? body.rawText.trim() : '';
  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
  if (!rawText || !patientId) return null;
  return { mode: 'text', rawText, patientId };
}

async function createStorageSignedUrl(imagePath: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return null;

  const storagePath = parseStoragePath(imagePath);
  if (!storagePath) return null;

  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/${storagePath.bucket}/${storagePath.objectPath}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS }),
  }).catch(() => null);
  if (!response?.ok) return null;

  const data = await response.json().catch(() => null) as StorageSignedUrlResponse | null;
  const signedPath = typeof data?.signedURL === 'string' ? data.signedURL : typeof data?.signedUrl === 'string' ? data.signedUrl : '';
  if (!signedPath) return null;

  return signedPath.startsWith('http') ? signedPath : `${supabaseUrl}${signedPath}`;
}

function parseStoragePath(imagePath: string): { bucket: string; objectPath: string } | null {
  const normalizedPath = imagePath.replace(/^\/+/, '');
  const slashIndex = normalizedPath.indexOf('/');
  if (slashIndex <= 0 || slashIndex === normalizedPath.length - 1) return null;

  if (!normalizedPath.startsWith(`${CLINIC_PHOTOS_BUCKET}/`)) {
    return {
      bucket: CLINIC_PHOTOS_BUCKET,
      objectPath: normalizedPath
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/'),
    };
  }

  const bucket = encodeURIComponent(normalizedPath.slice(0, slashIndex));
  const objectPath = normalizedPath
    .slice(slashIndex + 1)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return objectPath ? { bucket, objectPath } : null;
}

async function extractCandidatesFromImageWithOpenRouter(imageUrl: string): Promise<ScheduleCandidate[]> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) return [];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: SCHEDULE_EXTRACT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                instruction: '이미지에 명시된 날짜/시간/약/검사/방문 일정 후보를 줄 단위로 추출하세요. 문서의 발행일/작성일을 기준일로 삼아 오늘/오늘부터를 해석하세요. 명시 시간은 반드시 scheduled_at에 넣고, 사용자가 직접 정해야 하는 시간만 null로 두세요. 오후 9시는 21:00입니다. 고날에프/메노푸어/세트로타이드/오비드렐은 주사입니다. 불확실하거나 의료적 해석이 필요한 항목은 제외하세요.',
              }),
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0,
    }),
  }).catch(() => null);
  if (!response?.ok) return [];

  const data = await response.json().catch(() => null) as OpenRouterResponse | null;
  const content = data?.choices?.[0]?.message?.content ?? '';
  return parseCandidates(content);
}

async function extractCandidatesFromTextWithOpenRouter(rawText: string): Promise<ScheduleCandidate[]> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) return [];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: SCHEDULE_EXTRACT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify({
            instruction: '텍스트에 명시된 날짜/시간/약/검사/방문 일정 후보를 줄 단위로 추출하세요. 문서의 발행일/작성일을 기준일로 삼아 오늘/오늘부터를 해석하세요. 명시 시간은 반드시 scheduled_at에 넣고, 사용자가 직접 정해야 하는 시간만 null로 두세요. 오후 9시는 21:00입니다. 고날에프/메노푸어/세트로타이드/오비드렐은 주사입니다. 불확실하거나 의료적 해석이 필요한 항목은 제외하세요.',
            rawText,
          }),
        },
      ],
      temperature: 0,
    }),
  }).catch(() => null);
  if (!response?.ok) return [];

  const data = await response.json().catch(() => null) as OpenRouterResponse | null;
  const content = data?.choices?.[0]?.message?.content ?? '';
  return parseCandidates(content);
}

function parseCandidates(content: string): ScheduleCandidate[] {
  const parsed = parseJsonObject(content);
  if (!isObjectWithCandidates(parsed)) return [];

  return parsed.candidates
    .map(normalizeCandidate)
    .filter((candidate): candidate is ScheduleCandidate => candidate !== null);
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/u);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

function isObjectWithCandidates(value: unknown): value is { candidates: unknown[] } {
  return typeof value === 'object' && value !== null && Array.isArray((value as { candidates?: unknown }).candidates);
}

function normalizeCandidate(value: unknown): ScheduleCandidate | null {
  const title = normalizeText(readProperty(value, 'title'));
  if (!title || isUserTimeGuidanceTitle(title)) return null;

  const doseFromTitle = extractDoseParts(title);
  const dose = normalizeNullableText(readProperty(value, 'dose')) ?? doseFromTitle?.dose ?? null;
  const unit = normalizeNullableText(readProperty(value, 'unit')) ?? doseFromTitle?.unit ?? null;
  const type = normalizeScheduleType(readProperty(value, 'type'), title);
  if (!type) return null;

  return {
    type,
    title: normalizeMedicationTitle(title),
    scheduled_at: normalizeNullableText(readProperty(value, 'scheduled_at')),
    dose,
    unit,
  };
}

function readProperty(value: unknown, key: keyof ScheduleCandidate): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
  return value[key as keyof typeof value];
}

function normalizeScheduleType(value: unknown, title = ''): ScheduleType | null {
  const titleText = normalizeMedicationText(title);
  if (isKnownInjectionMedication(titleText)) return 'injection';

  const text = normalizeText(value)?.toLocaleLowerCase('ko-KR').replace(/[\s_-]/gu, '');
  if (!text) return null;
  if (text === 'injection' || text.includes('주사')) return 'injection';
  if (text === 'medication' || text === 'medicine' || text === 'pill' || text.includes('복용') || text.includes('약')) return 'medication';
  if (text === 'clinic' || text === 'visit' || text === 'appointment' || text === 'hospital' || text.includes('병원') || text.includes('방문') || text.includes('내원') || text.includes('검사')) return 'clinic';
  return null;
}

function normalizeMedicationTitle(title: string) {
  const normalized = normalizeMedicationText(title);
  if (normalized.includes('고날')) return '고날에프';
  if (normalized.includes('메노푸')) return '메노푸어';
  if (normalized.includes('세트로')) return '세트로타이드';
  if (normalized.includes('오비드렐')) return '오비드렐';
  if (normalized.includes('퓨리곤')) return '퓨리곤';
  return title;
}

function normalizeMedicationText(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s_-]/gu, '');
}

function isKnownInjectionMedication(text: string) {
  return /고날|메노푸|세트로|오비드렐|퓨리곤/u.test(text);
}

function isUserTimeGuidanceTitle(title: string) {
  const text = normalizeMedicationText(title);
  if (isKnownInjectionMedication(text)) return false;
  return /(회차.*시간|시간.*본인|시간.*정|시간.*기록|정확한시간|확인후입력)/u.test(text);
}

function extractDoseParts(title: string): { dose: string; unit: string } | null {
  const match = title.match(/(\d+(?:\.\d+)?)\s*(IU|iu|mg|mcg|mL|ml|정)\b/u);
  if (!match) return null;
  return { dose: match[1] ?? '', unit: normalizeDoseUnit(match[2] ?? '') };
}

function normalizeDoseUnit(unit: string) {
  if (/^iu$/iu.test(unit)) return 'IU';
  if (/^ml$/iu.test(unit)) return 'mL';
  return unit;
}

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return normalizeText(value);
}

export {};
