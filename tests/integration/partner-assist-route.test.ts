import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safePartnerItemId } from '../../src/services/partner-view';

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
    rpcResponses.push({ data: [{ card_id: '11111111-1111-1111-1111-111111111111', partner_assist_at: '2026-05-12T12:03:00.000Z' }], error: null });
    const { POST } = await import('../../app/api/partner/[token]/assist/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'record_assist', cardId: '11111111-1111-1111-1111-111111111111', actualTime: '2026-05-12T12:03:00.000Z' }),
    }), { params: Promise.resolve({ token: 'live-token' }) });
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(rpcCalls[0]).toMatchObject({ name: 'record_partner_assist' });
    expect(payload).toMatchObject({ cardId: '11111111-1111-1111-1111-111111111111', partnerAssistAt: '2026-05-12T12:03:00.000Z' });
  });

  it('resolves a partner-safe id before recording assist so raw card ids stay off the client', async () => {
    const rawCardId = '11111111-1111-4111-8111-111111111111';
    rpcResponses.push(
      { data: [{ id: rawCardId }], error: null },
      { data: [{ card_id: rawCardId, partner_assist_at: '2026-05-12T12:03:00.000Z' }], error: null },
    );
    const { POST } = await import('../../app/api/partner/[token]/assist/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'record_assist', cardId: safePartnerItemId(rawCardId), actualTime: '2026-05-12T12:03:00.000Z' }),
    }), { params: Promise.resolve({ token: 'live-token' }) });

    expect(response.status).toBe(202);
    expect(rpcCalls[0]).toMatchObject({ name: 'get_partner_action_view' });
    expect(rpcCalls[1]).toMatchObject({
      name: 'record_partner_assist',
      args: expect.objectContaining({ p_card_id: rawCardId }),
    });
  });
});
