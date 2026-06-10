import { describe, expect, it, vi } from 'vitest';
import { SupabaseReminderDispatchStore } from '../../src/lib/reminder-dispatch-repository';


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

const T60_WINDOW = {
  channel: 'web_push_t60' as const,
  offsetMinutes: 60 as const,
  startsAt: '2026-05-11T12:25:00.000Z',
  endsAt: '2026-05-11T12:35:00.000Z',
};

const T15_WINDOW = {
  channel: 'web_push_t15' as const,
  offsetMinutes: 15 as const,
  startsAt: '2026-05-11T11:40:00.000Z',
  endsAt: '2026-05-11T11:50:00.000Z',
};

type DispatchInsert = {
  card_id: string;
  scheduled_at: string;
  channel: string;
  status: string;
};

function createUniqueDispatchSupabase() {
  const seenKeys = new Set<string>();
  let pendingInsert: DispatchInsert | null = null;
  const insertChain = {
    insert: vi.fn((value: DispatchInsert) => {
      pendingInsert = value;
      return insertChain;
    }),
    select: vi.fn(() => insertChain),
    single: vi.fn(async () => {
      if (!pendingInsert) return { data: null, error: { message: 'missing insert' } };
      const key = `${pendingInsert.card_id}|${pendingInsert.scheduled_at}|${pendingInsert.channel}`;
      if (seenKeys.has(key)) {
        return {
          data: null,
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint "reminder_dispatches_card_time_channel_unique"',
          },
        };
      }
      seenKeys.add(key);
      return { data: { id: `dispatch-${seenKeys.size}` }, error: null };
    }),
  };
  const updateChain = {
    update: vi.fn(() => updateChain),
    eq: vi.fn(() => updateChain),
  };
  return {
    from: vi.fn(() => ({ ...insertChain, ...updateChain })),
    insertChain,
  };
}

describe('SupabaseReminderDispatchStore', () => {

  it('maps confirmed medication push candidate RPC rows without special-case filtering', async () => {
    const row = {
      card_id: 'medication-card',
      title: '듀파스톤 복용',
      scheduled_at: '2026-05-11T13:30:00.000Z',
      push_subscriptions: [
        { endpoint: 'https://push.example.test/1', keys: { p256dh: 'key', auth: 'auth' } },
      ],
    };
    const { client, calls } = clientReturning([row]);
    const store = new SupabaseReminderDispatchStore(client as never);

    await expect(store.findDuePushCandidates(T60_WINDOW)).resolves.toMatchObject([
      { cardId: 'medication-card', title: '듀파스톤 복용', pushSubscriptions: [{ endpoint: 'https://push.example.test/1' }] },
    ]);
    await expect(store.findDuePushCandidates(T15_WINDOW)).resolves.toMatchObject([
      { cardId: 'medication-card', title: '듀파스톤 복용', pushSubscriptions: [{ endpoint: 'https://push.example.test/1' }] },
    ]);
    expect(calls.map((call) => call.args?.p_channel)).toEqual(['web_push_t60', 'web_push_t15']);
  });
  it('rejects a duplicate push dispatch claim for the same card, time, and channel', async () => {
    const supabase = createUniqueDispatchSupabase();
    const store = new SupabaseReminderDispatchStore(supabase as never);
    const input = {
      cardId: '00000000-0000-4000-8000-000000000001',
      scheduledAt: '2026-05-11T12:00:00.000Z',
      channel: 'web_push_t15' as const,
    };

    const first = await store.claimPushDispatch(input);
    const second = await store.claimPushDispatch(input);

    expect(first).toEqual({ claimed: true, dispatchId: 'dispatch-1' });
    expect(second).toEqual({ claimed: false });
    expect(supabase.insertChain.insert).toHaveBeenCalledTimes(2);
  });
});
