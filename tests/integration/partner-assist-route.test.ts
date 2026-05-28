import { beforeEach, describe, expect, it, vi } from 'vitest';
type RpcResponse = { data: unknown; error: { message: string } | null };
type RpcCall = { name: string; args: Record<string, unknown> };

const rpcCalls = vi.hoisted((): RpcCall[] => []);
const rpcResponses = vi.hoisted((): RpcResponse[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      return rpcResponses.shift() ?? { data: null, error: { message: 'missing mock response' } };
    },
  }),
}));

describe('partner assist API route', () => {
  beforeEach(() => {
    rpcCalls.length = 0;
    rpcResponses.length = 0;
  });

  it('denies medical edit actions for partner tokens', async () => {
    const { POST } = await import('../../app/api/partner/[token]/assist/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/assist', {
      method: 'POST',
      body: JSON.stringify({ action: 'edit_dosage', cardId: '11111111-1111-1111-1111-111111111111' }),
    }), { params: Promise.resolve({ token: 'live-token' }) });

    expect(response.status).toBe(403);
    expect(rpcCalls).toHaveLength(0);
  });

  it('records partner assist on the canonical care card', async () => {
    rpcResponses.push({ data: [{ card_safe_id: 'safe-card-id', partner_assist_at: '2026-05-12T12:03:00.000Z' }], error: null });
    const { POST } = await import('../../app/api/partner/[token]/assist/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'record_assist', cardId: 'safe-card-id', actualTime: '2026-05-12T12:03:00.000Z' }),
    }), { params: Promise.resolve({ token: 'live-token' }) });
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(rpcCalls[0]).toMatchObject({
      name: 'record_partner_assist_by_safe_id',
      args: expect.objectContaining({ p_safe_id: 'safe-card-id' }),
    });
    expect(payload).toMatchObject({ cardId: 'safe-card-id', partnerAssistAt: '2026-05-12T12:03:00.000Z' });
    expect(JSON.stringify(payload)).not.toContain('11111111-1111-1111-1111-111111111111');
  });

  it('resolves a partner-safe id before recording assist so raw card ids stay off the client', async () => {
    rpcResponses.push({ data: [{ card_safe_id: 'safe-card-id', partner_assist_at: '2026-05-12T12:03:00.000Z' }], error: null });
    const { POST } = await import('../../app/api/partner/[token]/assist/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'record_assist', cardId: 'safe-card-id', actualTime: '2026-05-12T12:03:00.000Z' }),
    }), { params: Promise.resolve({ token: 'live-token' }) });

    expect(response.status).toBe(202);
    expect(rpcCalls[0]).toMatchObject({
      name: 'record_partner_assist_by_safe_id',
      args: expect.objectContaining({ p_safe_id: 'safe-card-id' }),
    });
    expect(rpcCalls).toHaveLength(1);
  });
});
