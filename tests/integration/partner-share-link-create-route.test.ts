import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type InsertPayload = Record<string, unknown>;

const userResponses = vi.hoisted((): UserResponse[] => []);
const rpcCalls = vi.hoisted((): string[] => []);
const insertPayloads = vi.hoisted((): InsertPayload[] => []);
const updatePayloads = vi.hoisted((): InsertPayload[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    rpc: async (name: string) => {
      rpcCalls.push(name);
      return { data: [{ couple_id: 'couple-1' }], error: null };
    },
    from: (table: string) => ({
      update: (payload: InsertPayload) => {
        updatePayloads.push({ table, ...payload });
        return { eq: () => ({ is: async () => ({ data: null, error: null }) }) };
      },
      insert: async (payload: InsertPayload) => {
        insertPayloads.push({ table, ...payload });
        return { data: null, error: null };
      },
    }),
  }),
}));

describe('partner share link creation route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    rpcCalls.length = 0;
    insertPayloads.length = 0;
    updatePayloads.length = 0;
  });

  it('lets a patient generate a real partner invite URL without storing the raw token', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/partner-share-links/route');

    const response = await POST(new NextRequest('http://localhost/api/partner-share-links', { method: 'POST' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(rpcCalls).toEqual(['init_couple_for_user']);
    expect(payload.url).toMatch(/^http:\/\/localhost\/partner\//u);
    expect(payload.url).not.toContain('demo-invite');
    expect(insertPayloads[0]).toMatchObject({ table: 'partner_share_links', couple_id: 'couple-1', created_by: 'patient-1', token_hash: expect.any(String) });
    expect(payload.url).not.toContain(String(insertPayloads[0]?.token_hash));
  });
});
