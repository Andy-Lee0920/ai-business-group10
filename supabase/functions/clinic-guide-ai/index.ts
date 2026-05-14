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

type ClinicGuideAiRequest = { userInput: string; patientId: string };
type ClinicGuideAiResponse = { matched: Medication | null; source: 'aliases' | 'llm' | 'none' };

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
  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
  const patientId = typeof body.patientId === 'string' ? body.patientId.trim() : '';
  if (!userInput || !patientId) return json({ matched: null, source: 'none' }, 400);

  const medications = await fetchMedications();
  const aliasMatch = findAliasMatch(medications, userInput);
  if (aliasMatch) return json({ matched: aliasMatch, source: 'aliases' });

  const llmMatch = await matchWithOpenRouter(userInput, medications);
  if (llmMatch) return json({ matched: llmMatch, source: 'llm' });

  return json({ matched: null, source: 'none' });
});

function json(payload: ClinicGuideAiResponse | { error: string }, status = 200) {
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

async function matchWithOpenRouter(userInput: string, medications: Medication[]) {
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

function parseMedicationId(content: string) {
  try {
    const parsed = JSON.parse(content) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id : null;
  } catch {
    return null;
  }
}

function normalizeMedicationText(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s\-_()]/gu, '');
}
