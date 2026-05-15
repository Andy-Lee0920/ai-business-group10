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
type ParsedScheduleExtract = { candidates: ScheduleCandidate[]; sourceText: string | null };
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
  '이미지/텍스트에서 읽은 원문을 source_text에 그대로 전사한 뒤 candidates를 만든다.',
  'Return JSON only: {"source_text":string,"candidates":[{"type":"injection"|"medication"|"clinic","title":string,"scheduled_at":string|null,"dose":string|null,"unit":string|null}]}',
].join(' ');

const KOREA_TIME_ZONE = 'Asia/Seoul';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DETERMINISTIC_CANDIDATES = 30;

const INJECTION_MEDICATION_ALIASES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /고날\s*(?:에프|f)?/iu, title: '고날에프' },
  { pattern: /세트로\s*(?:타이드)?/iu, title: '세트로타이드' },
  { pattern: /오비드렐/iu, title: '오비드렐' },
  { pattern: /퓨리곤/iu, title: '퓨리곤' },
  { pattern: /메노푸[어르]/iu, title: '메노푸어' },
  { pattern: /질정/iu, title: '질정' },
  { pattern: /프로게스테론/iu, title: '프로게스테론' },
];

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
                instruction: '먼저 이미지의 문서 본문을 source_text에 전사하세요. 그 source_text를 기준으로 날짜/시간/약/검사/방문 일정 후보를 줄 단위로 추출하세요. 문서의 발행일/작성일을 기준일로 삼아 오늘/오늘부터를 해석하세요. 명시 시간은 반드시 scheduled_at에 넣고, 사용자가 직접 정해야 하는 시간만 null로 두세요. 오후 9시는 21:00입니다. 고날에프/메노푸어/세트로타이드/오비드렐은 주사입니다. 불확실하거나 의료적 해석이 필요한 항목은 제외하세요.',
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
  const parsed = parseExtractPayload(content);
  const deterministicCandidates = parsed.sourceText ? extractDeterministicTextCandidates(parsed.sourceText) : [];
  return chooseCandidateSet(deterministicCandidates, parsed.candidates);
}

async function extractCandidatesFromTextWithOpenRouter(rawText: string): Promise<ScheduleCandidate[]> {
  const deterministicCandidates = extractDeterministicTextCandidates(rawText);
  if (deterministicCandidates.length) return deterministicCandidates;

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
            instruction: '텍스트 원문을 source_text에 그대로 넣고, 그 텍스트에 명시된 날짜/시간/약/검사/방문 일정 후보를 줄 단위로 추출하세요. 문서의 발행일/작성일을 기준일로 삼아 오늘/오늘부터를 해석하세요. 명시 시간은 반드시 scheduled_at에 넣고, 사용자가 직접 정해야 하는 시간만 null로 두세요. 오후 9시는 21:00입니다. 고날에프/메노푸어/세트로타이드/오비드렐은 주사입니다. 불확실하거나 의료적 해석이 필요한 항목은 제외하세요.',
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
  return parseExtractPayload(content).candidates;
}

function parseCandidates(content: string): ScheduleCandidate[] {
  return parseExtractPayload(content).candidates;
}

function parseExtractPayload(content: string): ParsedScheduleExtract {
  const parsed = parseJsonObject(content);
  if (!isObjectWithCandidates(parsed)) return { candidates: [], sourceText: null };

  const sourceText = normalizeNullableText(
    readLooseProperty(parsed, 'source_text') ?? readLooseProperty(parsed, 'extracted_text') ?? readLooseProperty(parsed, 'raw_text'),
  );
  const candidates = parsed.candidates
    .map(normalizeCandidate)
    .filter((candidate): candidate is ScheduleCandidate => candidate !== null);
  return { candidates, sourceText };
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

function readLooseProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
  return (value as Record<string, unknown>)[key];
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

function chooseCandidateSet(deterministicCandidates: ScheduleCandidate[], llmCandidates: ScheduleCandidate[]) {
  if (!deterministicCandidates.length) return llmCandidates;
  if (!llmCandidates.length) return deterministicCandidates;
  return deterministicCandidates.length >= llmCandidates.length ? deterministicCandidates : llmCandidates;
}

function extractDeterministicTextCandidates(rawText: string, now = new Date()): ScheduleCandidate[] {
  const baseDateKey = extractDocumentBaseDateKey(now, rawText);
  const segmentCandidates = splitScheduleInstructionSegments(rawText)
    .flatMap((segment) => extractDeterministicSegmentCandidates(segment, baseDateKey))
    .slice(0, MAX_DETERMINISTIC_CANDIDATES);
  if (segmentCandidates.length) return segmentCandidates;

  return extractDeterministicSegmentCandidates(rawText, baseDateKey);
}

function extractDeterministicSegmentCandidates(rawText: string, baseDateKey: string): ScheduleCandidate[] {
  const title = findScheduleTitle(rawText);
  if (!title) return [];

  const type = inferTextScheduleType(rawText, title);
  if (!type) return [];

  const durationDays = extractDurationDays(rawText);
  const times = shouldLeaveTimesForUser(rawText) ? [] : extractExplicitTimes(rawText);
  const frequency = extractDailyFrequency(rawText, times.length);
  const shouldExpandDuration = shouldExpandDurationFrequency(rawText, durationDays, frequency, times.length);
  const dose = extractDose(rawText);
  const unit = dose ? extractDoseUnit(rawText) : null;
  const startDateKey = getStartKoreanDateKey(baseDateKey, rawText);

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

function splitScheduleInstructionSegments(rawText: string) {
  return rawText
    .split(/\r?\n|[•●▪◦]\s*/u)
    .map((segment) => segment.replace(/^\s*(?:[-*]|\d+\.)\s*/u, '').trim())
    .filter(Boolean)
    .filter(isScheduleInstructionSegment);
}

function isScheduleInstructionSegment(segment: string) {
  if (/^(?:환자\s*정보|투약\s*안내|다음\s*방문\s*안내|공유\s*안내|메모|End of document)/iu.test(segment)) return false;
  if (/최종\s*주사\s*여부|병원\s*안내를\s*다시\s*확인|공유해\s*주세요/iu.test(segment)) return false;
  if (/^방문\s*목적\s*[:：]/iu.test(segment)) return false;
  if (/안내문?$/u.test(segment) && !/(고날|세트로|오비드렐|퓨리곤|메노푸|질정|프로게스테론|주사|복용|사용|방문|내원|검사|채혈|초음파)/iu.test(segment)) return false;
  return /(고날|세트로|오비드렐|퓨리곤|메노푸|질정|프로게스테론|주사|복용|사용|방문|내원|검사|채혈|초음파)/iu.test(segment);
}

function findScheduleTitle(rawText: string) {
  const medicationTitle = INJECTION_MEDICATION_ALIASES.find((alias) => alias.pattern.test(rawText))?.title;
  if (medicationTitle) return medicationTitle;
  if (/방문|내원|검사|초음파|채혈/iu.test(rawText)) return '병원 방문';
  if (/주사|맞|펜/iu.test(rawText)) return '주사';
  return null;
}

function inferTextScheduleType(rawText: string, title: string): ScheduleType | null {
  if (title === '병원 방문') return 'clinic';
  if (title === '질정' || title === '프로게스테론') return 'medication';
  if (/주사|맞|펜|IU|고날|세트로|오비드렐|퓨리곤|메노푸[어르]/iu.test(rawText)) return 'injection';
  if (/복용|먹|질정|정\b|사용/iu.test(rawText)) return 'medication';
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

function shouldLeaveTimesForUser(rawText: string) {
  return /본인이\s*정|직접\s*정|시간은\s*본인|시간을\s*본인|정확한\s*시간|시간\s*확인|확인\s*후\s*입력|시간.*기록/iu.test(rawText);
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

function extractDocumentBaseDateKey(now: Date, rawText: string) {
  const baseMatch = rawText.match(/(?:발행일|작성일)\s*[|:]?\s*(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/u);
  if (baseMatch) {
    const year = Number.parseInt(baseMatch[1] ?? '', 10);
    const month = Number.parseInt(baseMatch[2] ?? '', 10);
    const day = Number.parseInt(baseMatch[3] ?? '', 10);
    if (isValidDateParts(year, month, day)) return formatDateKey(year, month, day);
  }
  return getKoreanDateKey(now, 0);
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

function getStartKoreanDateKey(baseDateKey: string, rawText: string) {
  const explicitDateKey = extractExplicitKoreanDateKey(baseDateKey, rawText);
  if (explicitDateKey) return explicitDateKey;
  return rawText.includes('내일') ? addDaysToKoreanDateKey(baseDateKey, 1) : baseDateKey;
}

function extractExplicitKoreanDateKey(baseDateKey: string, rawText: string) {
  const match = rawText.match(/(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일/u);
  if (!match) return null;

  const currentYear = Number.parseInt(baseDateKey.slice(0, 4), 10);
  const year = Number.parseInt(match[1] ?? String(currentYear), 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  if (!isValidDateParts(year, month, day)) return null;
  return formatDateKey(year, month, day);
}

function isValidDateParts(year: number, month: number, day: number) {
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function formatDateKey(year: number, month: number, day: number) {
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

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return normalizeText(value);
}

export {};
