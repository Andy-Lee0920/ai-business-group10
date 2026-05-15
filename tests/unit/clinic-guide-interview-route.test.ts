import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/clinic-guide/interview/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/clinic-guide/interview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/clinic-guide/interview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns 401 before proxying when no authenticated patient exists', async () => {
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await POST(jsonRequest({ step: 'same_medication', userInput: '바뀌었어요' }));

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls the Supabase Edge Function with interview mode and forces confirmation on the response', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'patient-1' } }, error: null }) },
    } as never);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      nextStep: 'add_medication',
      question: '새 약 이름을 알려주세요.',
      chips: ['목록에서 찾기'],
      draft: { same_medication: false },
      requiresUserConfirmation: false,
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const response = await POST(jsonRequest({ step: 'same_medication', userInput: '바뀌었어요', context: {} }));
    const payload = await response.json() as { requiresUserConfirmation: boolean; draft: { same_medication: boolean } };

    expect(response.status).toBe(200);
    expect(payload.requiresUserConfirmation).toBe(true);
    expect(payload.draft.same_medication).toBe(false);
    expect(fetch).toHaveBeenCalledWith('https://example.supabase.co/functions/v1/clinic-guide-ai', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer anon-key' }),
      body: JSON.stringify({ mode: 'interview', patientId: 'patient-1', step: 'same_medication', context: {}, userInput: '바뀌었어요' }),
    }));
  });

  it('returns deterministic fallback when the Edge Function fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'patient-1' } }, error: null }) },
    } as never);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 503 })));

    const response = await POST(jsonRequest({ step: 'medication_days', userInput: '3일', context: {} }));
    const payload = await response.json() as { fallbackReason: string; requiresUserConfirmation: boolean; draft: { medication_days: number } };

    expect(response.status).toBe(200);
    expect(payload.fallbackReason).toBe('edge_unavailable');
    expect(payload.requiresUserConfirmation).toBe(true);
    expect(payload.draft.medication_days).toBe(3);
  });

  it('falls back on malformed Edge Function JSON without leaking technical errors', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'patient-1' } }, error: null }) },
    } as never);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ question: '' }), { status: 200 })));

    const response = await POST(jsonRequest({ step: 'trigger_plan', userInput: '내일', context: {} }));
    const payload = await response.json() as { fallbackReason: string; draft: { trigger_plan: string }; warnings: string[] };

    expect(response.status).toBe(200);
    expect(payload.fallbackReason).toBe('malformed_edge_response');
    expect(payload.draft.trigger_plan).toBe('tomorrow');
    expect(payload.warnings.join(' ')).not.toMatch(/stack|supabase|OpenRouter/iu);
  });
});
