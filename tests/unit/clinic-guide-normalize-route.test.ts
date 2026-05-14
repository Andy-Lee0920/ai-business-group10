import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/clinic-guide/normalize/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/clinic-guide/normalize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/clinic-guide/normalize', () => {
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

    const response = await POST(jsonRequest({ userInput: '고날에프' }));

    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('proxies authenticated normalization requests to the Supabase Edge Function', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'patient-1' } }, error: null }) },
    } as never);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      matched: { id: 'gonal-f', brand_name_ko: '고날에프' },
      source: 'aliases',
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const response = await POST(jsonRequest({ userInput: '고날에프' }));
    const payload = await response.json() as { matched: { id: string }; source: string };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ matched: { id: 'gonal-f' }, source: 'aliases' });
    expect(fetch).toHaveBeenCalledWith('https://example.supabase.co/functions/v1/clinic-guide-ai', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer anon-key' }),
      body: JSON.stringify({ userInput: '고날에프', patientId: 'patient-1' }),
    }));
  });
});
