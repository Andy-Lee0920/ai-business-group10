import { describe, expect, it } from 'vitest';
import { SupabaseReminderDispatchStore } from '../../src/lib/reminder-dispatch-repository';
import type { ReminderPushWindow } from '../../src/domain/reminder-dispatch';

type RpcCall = {
  name: string;
  args?: Record<string, unknown>;
};

function clientReturning<T>(data: T[]) {
  const calls: RpcCall[] = [];
  return {
    calls,
    client: {
      rpc: async <TRow>(name: string, args?: Record<string, unknown>) => {
        calls.push({ name, args });
        return { data: data as unknown as TRow[], error: null };
      },
      from: () => {
        throw new Error('not used');
      },
    },
  };
}

const T60_WINDOW: ReminderPushWindow = {
  channel: 'web_push_t60',
  offsetMinutes: 60,
  startsAt: '2026-05-11T12:25:00.000Z',
  endsAt: '2026-05-11T12:35:00.000Z',
};

const T15_WINDOW: ReminderPushWindow = {
  channel: 'web_push_t15',
  offsetMinutes: 15,
  startsAt: '2026-05-11T11:40:00.000Z',
  endsAt: '2026-05-11T11:50:00.000Z',
};

describe('SupabaseReminderDispatchStore', () => {
  it('maps medication cards from T-60 and T-15 push candidate RPC rows', async () => {
    const row = {
      card_id: 'medication-card',
      title: '듀파스톤 복용',
      card_type: 'medication',
      scheduled_at: '2026-05-11T13:30:00.000Z',
      push_subscriptions: [{ endpoint: 'https://push.example.test/1', keys: { p256dh: 'key', auth: 'auth' } }],
    };
    const { client, calls } = clientReturning([row]);
    const store = new SupabaseReminderDispatchStore(client);

    await expect(store.findDuePushCandidates(T60_WINDOW)).resolves.toMatchObject([
      { cardId: 'medication-card', cardType: 'medication', pushSubscriptions: [{ endpoint: 'https://push.example.test/1' }] },
    ]);
    await expect(store.findDuePushCandidates(T15_WINDOW)).resolves.toMatchObject([
      { cardId: 'medication-card', cardType: 'medication', pushSubscriptions: [{ endpoint: 'https://push.example.test/1' }] },
    ]);
    expect(calls.map((call) => call.args?.p_channel)).toEqual(['web_push_t60', 'web_push_t15']);
  });
});
