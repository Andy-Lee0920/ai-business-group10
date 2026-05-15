declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type ScheduleExtractRequest = {
  mode: 'image';
  imagePath: string;
  patientId: string;
};

type ScheduleCandidate = {
  type: string;
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

const OPENROUTER_MODEL = 'anthropic/claude-3-haiku-vision';
const CLINIC_PHOTOS_BUCKET = 'clinic-photos';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await request.json().catch(() => ({})) as Partial<ScheduleExtractRequest>;
  if (body.mode !== 'image') return json({ error: 'unsupported_mode' }, 400);

  const extractRequest = normalizeImageRequest(body);
  if (!extractRequest) return json({ error: 'invalid_image_request' }, 400);

  const signedUrl = await createStorageSignedUrl(extractRequest.imagePath);
  if (!signedUrl) return json({ candidates: [] });

  const candidates = await extractCandidatesWithOpenRouter(signedUrl);
  return json({ candidates });
});

function json(payload: ScheduleExtractResponse | ErrorResponse, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function normalizeImageRequest(body: Partial<ScheduleExtractRequest>): ScheduleExtractRequest | null {
  const imagePath = typeof body.imagePath === 'string' ? body.imagePath.trim() : '';
  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
  if (!imagePath || !patientId) return null;
  return { mode: 'image', imagePath, patientId };
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

async function extractCandidatesWithOpenRouter(imageUrl: string): Promise<ScheduleCandidate[]> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) return [];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: '의료 판단 금지, 일정 후보만 추출. IVF 환자의 병원 안내 이미지에서 사용자가 확인할 일정 후보만 JSON으로 추출한다. 진단, 용량 판단, 치료 단계 판단, 복약/주사 권고를 하지 않는다. Return JSON only: {"candidates":[{"type":string,"title":string,"scheduled_at":string|null,"dose":string|null,"unit":string|null}]}',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                instruction: '이미지에 명시된 날짜/시간/약/검사/방문 일정 후보만 추출하세요. 불확실하거나 의료적 해석이 필요한 항목은 제외하세요.',
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
  const type = normalizeText(readProperty(value, 'type'));
  const title = normalizeText(readProperty(value, 'title'));
  if (!type || !title) return null;

  return {
    type,
    title,
    scheduled_at: normalizeNullableText(readProperty(value, 'scheduled_at')),
    dose: normalizeNullableText(readProperty(value, 'dose')),
    unit: normalizeNullableText(readProperty(value, 'unit')),
  };
}

function readProperty(value: unknown, key: keyof ScheduleCandidate): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
  return value[key as keyof typeof value];
}

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return normalizeText(value);
}

export {};
