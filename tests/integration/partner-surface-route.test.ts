import { describe, expect, it, vi } from 'vitest';

type RpcResponse = { data: unknown; error: { message: string } | null };
type RpcCall = { name: string; args: Record<string, string> };

const rpcCalls = vi.hoisted((): RpcCall[] => []);
const rpcResponses = vi.hoisted((): RpcResponse[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    rpc: async (name: string, args: Record<string, string>) => {
      rpcCalls.push({ name, args });
      return rpcResponses.shift() ?? { data: null, error: { message: 'missing mock response' } };
    },
  }),
}));

describe('partner surface API route', () => {
  it('returns partner-safe surface signal without raw medical rule fields', async () => {
    rpcResponses.push(
      { data: true, error: null },
      {
        data: [
          {
            title: '22:00 오비드렐 트리거 확인',
            scheduled_at: '2026-05-10T13:00:00.000Z',
            card_type: 'injection',
            description: '냉장 보관 후 시간만 같이 확인',
            display_state: 'current',
            revision: 2,
          },
        ],
        error: null,
      },
    );
    const { GET } = await import('../../app/api/partner/[token]/surface/route');

    const response = await GET(new Request('http://localhost/api/partner/live-token/surface'), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-fevio-sync-strategy')).toBe('swr-30s');
    expect(rpcCalls.map((call) => call.name)).toContain('get_partner_action_view');
    expect(payload).toMatchObject({ urgencyTier: 'routine', intensity: 0.5, phase: 'injection' });
    expect(payload.momentCopy).toContain('함께');
    expect(serialized).not.toMatch(/trigger_shot|overrideReason|milestone|proximityDays|오비드렐/u);
  });

  it('returns 404 for expired partner tokens', async () => {
    rpcResponses.push({ data: false, error: null });
    const { GET } = await import('../../app/api/partner/[token]/surface/route');

    const response = await GET(new Request('http://localhost/api/partner/expired/surface'), {
      params: Promise.resolve({ token: 'expired' }),
    });

    expect(response.status).toBe(404);
  });
});
