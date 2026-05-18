import { describe, expect, it, vi } from 'vitest';
import { dispatchDueEmailReminders, dispatchDuePushReminders, type ReminderDispatchStore, type ReminderMailer, type ReminderPushDispatchStore, type ReminderPusher } from '../../src/services/reminder-dispatch-service';

const NOW = new Date('2026-05-11T11:30:00.000Z');

function createStore(overrides: Partial<ReminderDispatchStore> = {}): ReminderDispatchStore {
  return {
    findDueEmailCandidates: vi.fn().mockResolvedValue([
      {
        cardId: 'card-1',
        title: '오늘 21시 고날에프 1회',
        scheduledAt: '2026-05-11T12:00:00.000Z',
        recipientEmail: 'user@example.com',
      },
    ]),
    claimEmailDispatch: vi.fn().mockResolvedValue({ claimed: true, dispatchId: 'dispatch-1' }),
    markEmailDispatchSent: vi.fn().mockResolvedValue(undefined),
    markEmailDispatchFailed: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}



function createPushStore(overrides: Partial<ReminderPushDispatchStore> = {}): ReminderPushDispatchStore {
  return {
    findDuePushCandidates: vi.fn().mockResolvedValue([
      {
        cardId: 'card-1',
        title: '오늘 21시 고날에프 1회',
        scheduledAt: '2026-05-11T12:00:00.000Z',
        recipientEmail: 'user@example.com',
        pushSubscriptions: [{ endpoint: 'https://push.example.test/1', keys: { p256dh: 'key', auth: 'auth' } }],
      },
    ]),
    claimPushDispatch: vi.fn().mockResolvedValue({ claimed: true, dispatchId: 'dispatch-1' }),
    markPushDispatchSent: vi.fn().mockResolvedValue(undefined),
    markPushDispatchFailed: vi.fn().mockResolvedValue(undefined),
    deletePushSubscription: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createPusher(overrides: Partial<ReminderPusher> = {}): ReminderPusher {
  return {
    send: vi.fn().mockResolvedValue({ providerMessageId: 'push-1' }),
    ...overrides,
  };
}

function createMailer(overrides: Partial<ReminderMailer> = {}): ReminderMailer {
  return {
    send: vi.fn().mockResolvedValue({ providerMessageId: 'msg-1' }),
    ...overrides,
  };
}

describe('dispatchDueEmailReminders', () => {
  it('claims a due injection reminder before sending one email and marking it sent', async () => {
    const store = createStore();
    const mailer = createMailer();

    const result = await dispatchDueEmailReminders({ store, mailer, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    expect(store.findDueEmailCandidates).toHaveBeenCalledWith({
      startsAt: '2026-05-11T11:59:00.000Z',
      endsAt: '2026-05-11T12:01:00.000Z',
    });
    expect(store.claimEmailDispatch).toHaveBeenCalledWith({
      cardId: 'card-1',
      scheduledAt: '2026-05-11T12:00:00.000Z',
      recipientEmail: 'user@example.com',
    });
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: '[Fevio] 확인할 주사 시간이 가까워졌어요',
      text: expect.stringContaining('오늘 21시 고날에프 1회'),
    }));
    expect(store.markEmailDispatchSent).toHaveBeenCalledWith({ dispatchId: 'dispatch-1', providerMessageId: 'msg-1' });
    expect(result).toEqual({ candidates: 1, sent: 1, skipped: 0, failed: 0 });
  });

  it('does not send a duplicate when the dispatch row already exists', async () => {
    const store = createStore({ claimEmailDispatch: vi.fn().mockResolvedValue({ claimed: false }) });
    const mailer = createMailer();

    const result = await dispatchDueEmailReminders({ store, mailer, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    expect(mailer.send).not.toHaveBeenCalled();
    expect(result).toEqual({ candidates: 1, sent: 0, skipped: 1, failed: 0 });
  });

  it('marks the claimed dispatch failed when the provider rejects the email', async () => {
    const store = createStore();
    const mailer = createMailer({ send: vi.fn().mockRejectedValue(new Error('provider rejected')) });

    const result = await dispatchDueEmailReminders({ store, mailer, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    expect(store.markEmailDispatchFailed).toHaveBeenCalledWith({ dispatchId: 'dispatch-1', error: 'provider rejected' });
    expect(result).toEqual({ candidates: 1, sent: 0, skipped: 0, failed: 1 });
  });
});

describe('dispatchDuePushReminders', () => {
  it('claims T-60/T-15 push windows before sending safe web push payloads', async () => {
    const store = createPushStore();
    const pusher = createPusher();

    const result = await dispatchDuePushReminders({ store, pusher, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    expect(store.findDuePushCandidates).toHaveBeenCalledWith({
      channel: 'web_push_t60',
      offsetMinutes: 60,
      startsAt: '2026-05-11T12:29:00.000Z',
      endsAt: '2026-05-11T12:31:00.000Z',
    });
    expect(store.findDuePushCandidates).toHaveBeenCalledWith({
      channel: 'web_push_t15',
      offsetMinutes: 15,
      startsAt: '2026-05-11T11:44:00.000Z',
      endsAt: '2026-05-11T11:46:00.000Z',
    });
    expect(store.claimPushDispatch).toHaveBeenCalledWith({
      cardId: 'card-1',
      scheduledAt: '2026-05-11T12:00:00.000Z',
      channel: 'web_push_t60',
    });
    expect(pusher.send).toHaveBeenCalledWith({
      subscription: { endpoint: 'https://push.example.test/1', keys: { p256dh: 'key', auth: 'auth' } },
      payload: {
        title: '오늘 21시 고날에프 1회',
        body: '예정 시간: 2026. 5. 11. 오후 9:00',
        url: '/home',
        tag: 'fevio-reminder-card-1',
      },
    });
    expect(store.markPushDispatchSent).toHaveBeenCalledWith({ dispatchId: 'dispatch-1', providerMessageId: 'push-1' });
    expect(result).toEqual({ candidates: 2, sent: 2, skipped: 0, failed: 0 });
  });

  it('removes expired browser push subscriptions and still sends to remaining subscriptions', async () => {
    const expiredSubscription = { endpoint: 'https://push.example.test/expired', keys: { p256dh: 'old-key', auth: 'old-auth' } };
    const activeSubscription = { endpoint: 'https://push.example.test/active', keys: { p256dh: 'new-key', auth: 'new-auth' } };
    const store = createPushStore({
      findDuePushCandidates: vi.fn(async (window) => window.channel === 'web_push_t60' ? [{
        cardId: 'card-1',
        title: '오늘 21시 고날에프 1회',
        scheduledAt: '2026-05-11T12:00:00.000Z',
        recipientEmail: 'user@example.com',
        pushSubscriptions: [expiredSubscription, activeSubscription],
      }] : []),
      deletePushSubscription: vi.fn().mockResolvedValue(undefined),
    } as Partial<ReminderPushDispatchStore>);
    const pusher = createPusher({
      send: vi.fn(async ({ subscription }) => {
        if (subscription.endpoint === expiredSubscription.endpoint) {
          const error = new Error('push subscription expired') as Error & { statusCode: number };
          error.statusCode = 410;
          throw error;
        }
        return { providerMessageId: 'push-active' };
      }),
    });

    const result = await dispatchDuePushReminders({ store, pusher, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    expect(store.deletePushSubscription).toHaveBeenCalledWith({ endpoint: expiredSubscription.endpoint });
    expect(store.markPushDispatchSent).toHaveBeenCalledWith({ dispatchId: 'dispatch-1', providerMessageId: 'push-active' });
    expect(store.markPushDispatchFailed).not.toHaveBeenCalled();
    expect(result).toEqual({ candidates: 1, sent: 1, skipped: 0, failed: 0 });
  });

});
