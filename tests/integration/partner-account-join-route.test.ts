import { describe, expect, it, vi, beforeEach } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type RpcResponse = { data: unknown; error: { message: string; code?: string } | null };
type RpcCall = { name: string; args: Record<string, unknown> };

const userResponses = vi.hoisted((): UserResponse[] => []);
const rpcResponses = vi.hoisted((): RpcResponse[] => []);
const rpcCalls = vi.hoisted((): RpcCall[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      return rpcResponses.shift() ?? { data: null, error: { message: 'missing mock response' } };
    },
  }),
}));

describe('partner account join route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    rpcResponses.length = 0;
    rpcCalls.length = 0;
  });

  it('creates a partner membership for the invite token and returns a partner projection redirect', async () => {
    userResponses.push({ data: { user: { id: 'partner-user-1' } }, error: null });
    rpcResponses.push({
      data: [{
        couple_id: 'couple-1',
        cycle_id: 'cycle-1',
        partner_membership_id: 'membership-partner-1',
        patient_membership_id: 'membership-patient-1',
        sharing_scope: 'care',
        permission_level: 'assist_action',
        accepted_at: '2026-05-12T05:00:00.000Z',
      }],
      error: null,
    });
    const { POST } = await import('../../app/api/partner/[token]/accept/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/accept', { method: 'POST' }), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0]?.name).toBe('accept_partner_share_invite');
    expect(rpcCalls[0]?.args).toEqual({ p_token_hash: expect.any(String) });
    expect(JSON.stringify(rpcCalls[0]?.args)).not.toContain('live-token');
    expect(payload).toMatchObject({
      joined: true,
      redirectTo: '/partner/live-token?joined=1',
      membership: {
        cycleId: 'cycle-1',
        role: 'partner',
        surface: 'partner_assist_operation',
        sharingScope: 'care',
        permissionLevel: 'assist_action',
      },
    });
  });

  it('requires a logged-in partner account before accepting an invite', async () => {
    userResponses.push({ data: { user: null }, error: null });
    const { POST } = await import('../../app/api/partner/[token]/accept/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/accept', { method: 'POST' }), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ error: 'unauthenticated', signInUrl: '/auth/sign-in?next=%2Fpartner%2Flive-token' });
    expect(rpcCalls).toHaveLength(0);
  });

  it('safely rejects used or owner-owned invites without leaking the token hash', async () => {
    userResponses.push({ data: { user: { id: 'patient-owner' } }, error: null });
    rpcResponses.push({ data: null, error: { message: 'partner_invite_own_link' } });
    const { POST } = await import('../../app/api/partner/[token]/accept/route');

    const response = await POST(new Request('http://localhost/api/partner/live-token/accept', { method: 'POST' }), {
      params: Promise.resolve({ token: 'live-token' }),
    });
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(409);
    expect(body).toContain('partner_invite_rejected');
    expect(body).not.toContain('live-token');
    expect(body).not.toContain('partner_invite_own_link');
  });
});
