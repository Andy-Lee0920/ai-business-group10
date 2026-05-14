import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type UpdateCall = { table: string; values: Record<string, unknown>; filters: Array<[string, unknown]> };

const userResponses = vi.hoisted((): UserResponse[] => []);
const updateCalls = vi.hoisted((): UpdateCall[] => []);
const updateErrors = vi.hoisted((): Array<{ message: string } | null> => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => {
        const call: UpdateCall = { table, values, filters: [] };
        updateCalls.push(call);
        const builder = {
          error: updateErrors.shift() ?? null,
          eq(column: string, value: unknown) {
            call.filters.push([column, value]);
            return builder;
          },
        };
        return builder;
      },
    }),
  }),
}));

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/partner/approve', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('partner approve route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    updateCalls.length = 0;
    updateErrors.length = 0;
  });

  it('approves only a link owned by the current patient and sets approved_at', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/partner/approve/route');

    const response = await POST(postRequest({ linkId: 'link-1', action: 'approve' }));

    expect(response.status).toBe(200);
    expect(updateCalls[0]).toMatchObject({
      table: 'partner_links',
      values: { status: 'approved', approved_at: expect.any(String) },
      filters: [['id', 'link-1'], ['patient_id', 'patient-1']],
    });
  });

  it('revokes by resetting the link to a reusable pending invite and clearing partner identity', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/partner/approve/route');

    const response = await POST(postRequest({ linkId: 'link-1', action: 'revoke' }));

    expect(response.status).toBe(200);
    expect(updateCalls[0]).toMatchObject({
      values: {
        status: 'pending',
        partner_id: null,
        requested_at: null,
        approved_at: null,
      },
      filters: [['id', 'link-1'], ['patient_id', 'patient-1']],
    });
  });

  it('rejects unknown actions before touching partner_links', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/partner/approve/route');

    const response = await POST(postRequest({ linkId: 'link-1', action: 'delete' }));

    expect(response.status).toBe(400);
    expect(updateCalls).toEqual([]);
  });
});
