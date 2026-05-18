import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type UpsertCall = { table: string; values: Record<string, unknown>; options: Record<string, unknown> | undefined };

const userResponses = vi.hoisted((): UserResponse[] => []);
const upsertCalls = vi.hoisted((): UpsertCall[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    from: (table: string) => ({
      upsert: async (values: Record<string, unknown>, options?: Record<string, unknown>) => {
        upsertCalls.push({ table, values, options });
        return { data: null, error: null };
      },
    }),
  }),
}));

const validSubscription = {
  endpoint: 'https://push.example.test/subscription-1',
  expirationTime: null,
  keys: {
    p256dh: 'p256dh-key-material',
    auth: 'auth-key-material',
  },
};

function subscribeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Vitest Browser' },
    body: JSON.stringify(body),
  });
}

describe('/api/push/subscribe', () => {
  beforeEach(() => {
    userResponses.length = 0;
    upsertCalls.length = 0;
  });

  it('requires a signed-in patient before storing a browser push subscription', async () => {
    userResponses.push({ data: { user: null }, error: null });
    const { POST } = await import('../../app/api/push/subscribe/route');

    const response = await POST(subscribeRequest(validSubscription));

    expect(response.status).toBe(401);
    expect(upsertCalls).toHaveLength(0);
  });

  it('stores the authenticated browser push endpoint without clinical payload data', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/push/subscribe/route');

    const response = await POST(subscribeRequest(validSubscription));

    expect(response.status).toBe(200);
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toMatchObject({
      table: 'push_subscriptions',
      options: { onConflict: 'endpoint' },
      values: {
        user_id: 'patient-1',
        endpoint: validSubscription.endpoint,
        subscription: validSubscription,
        user_agent: 'Vitest Browser',
      },
    });
    expect(JSON.stringify(upsertCalls[0].values)).not.toMatch(/고날에프|병원|clinic|memo|dose|진단/u);
  });
});
