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

describe('partner cards API route', () => {
  it('returns 404 for expired partner tokens', async () => {
    rpcResponses.push({ data: false, error: null });
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/expired/cards'), {
      params: Promise.resolve({ token: 'expired' }),
    });

    expect(response.status).toBe(404);
    expect(rpcCalls.at(-1)?.name).toBe('is_partner_share_link_usable');
  });

  it('returns 404 for revoked partner tokens', async () => {
    rpcResponses.push({ data: false, error: null });
    const { GET } = await import('../../app/api/partner/[token]/cards/route');

    const response = await GET(new Request('http://localhost/api/partner/revoked/cards'), {
      params: Promise.resolve({ token: 'revoked' }),
    });

    expect(response.status).toBe(404);
  });
});
