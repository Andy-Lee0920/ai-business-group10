import { describe, expect, it, beforeEach, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type RpcResponse = { data: unknown; error: { message: string } | null };
type RpcCall = { name: string; args?: Record<string, unknown> };

const userResponses = vi.hoisted((): UserResponse[] => []);
const rpcResponses = vi.hoisted((): RpcResponse[] => []);
const rpcCalls = vi.hoisted((): RpcCall[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    rpc: async (name: string, args?: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      return rpcResponses.shift() ?? { data: null, error: { message: 'missing mock response' } };
    },
  }),
}));

describe('patient sharing scope API route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    rpcResponses.length = 0;
    rpcCalls.length = 0;
  });

  it('returns persisted patient-owned sharing scope', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    rpcResponses.push({ data: [{ cycle_id: 'cycle-1', sharing_scope: 'basic', partner_connected: true }], error: null });
    const { GET } = await import('../../app/api/sharing-scope/route');

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(rpcCalls).toEqual([{ name: 'get_patient_sharing_scope', args: undefined }]);
    expect(payload).toEqual({ cycleId: 'cycle-1', sharingScope: 'basic', partnerConnected: true });
  });

  it('persists a changed sharing scope through the database RPC', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    rpcResponses.push({ data: [{ cycle_id: 'cycle-1', sharing_scope: 'emotional', partner_connected: true }], error: null });
    const { PATCH } = await import('../../app/api/sharing-scope/route');

    const response = await PATCH(new Request('http://localhost/api/sharing-scope', {
      method: 'PATCH',
      body: JSON.stringify({ sharingScope: 'emotional' }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(rpcCalls).toEqual([{ name: 'set_patient_sharing_scope', args: { p_scope: 'emotional' } }]);
    expect(payload).toEqual({ cycleId: 'cycle-1', sharingScope: 'emotional', partnerConnected: true });
  });

  it('rejects invalid sharing scope values before touching the database', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { PATCH } = await import('../../app/api/sharing-scope/route');

    const response = await PATCH(new Request('http://localhost/api/sharing-scope', {
      method: 'PATCH',
      body: JSON.stringify({ sharingScope: 'full_access' }),
    }));

    expect(response.status).toBe(400);
    expect(rpcCalls).toHaveLength(0);
  });
});
