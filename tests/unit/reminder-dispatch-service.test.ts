import { describe, expect, it, vi } from 'vitest';
import { ReminderPushDeliveryFailure, dispatchDueEmailReminders, dispatchDuePushReminders, type ReminderDispatchStore, type ReminderMailer, type ReminderPushDispatchStore, type ReminderPusher } from '../../src/services/reminder-dispatch-service';

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
    revokePushSubscription: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function expectNonEmptyString(value: string | undefined) {
  if (typeof value !== 'string') {
    expect(value).toBeTypeOf('string');
    return;
  }
  expect(value.length).toBeGreaterThan(0);
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
      startsAt: '2026-05-11T12:25:00.000Z',
      endsAt: '2026-05-11T12:35:00.000Z',
    });
    expect(store.findDuePushCandidates).toHaveBeenCalledWith({
      channel: 'web_push_t15',
      offsetMinutes: 15,
      startsAt: '2026-05-11T11:40:00.000Z',
      endsAt: '2026-05-11T11:50:00.000Z',
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

  it('revokes 410/404 browser push subscriptions and records subscription_revoked when delivery cannot continue', async () => {
    const revokedSubscription = { endpoint: 'https://push.example.test/revoked', keys: { p256dh: 'old-key', auth: 'old-auth' } };
    const store = createPushStore({
      findDuePushCandidates: vi.fn(async (window) => window.channel === 'web_push_t60' ? [{
        cardId: 'card-1',
        title: '오늘 21시 고날에프 1회',
        scheduledAt: '2026-05-11T12:00:00.000Z',
        recipientEmail: 'user@example.com',
        pushSubscriptions: [revokedSubscription],
      }] : []),
      revokePushSubscription: vi.fn().mockResolvedValue(undefined),
    });
    const pusher = createPusher({
      send: vi.fn().mockRejectedValue(new ReminderPushDeliveryFailure('subscription_revoked')),
    });

    const result = await dispatchDuePushReminders({ store, pusher, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    const revokeInput = vi.mocked(store.revokePushSubscription).mock.calls[0]?.[0];
    expect(revokeInput?.endpoint).toBe(revokedSubscription.endpoint);
    expectNonEmptyString(revokeInput?.revokedAt);
    expect(store.markPushDispatchFailed).toHaveBeenCalledWith({
      dispatchId: 'dispatch-1',
      failureReason: 'subscription_revoked',
    });
    expect(store.markPushDispatchSent).not.toHaveBeenCalled();
    expect(result).toEqual({ candidates: 1, sent: 0, skipped: 0, failed: 1 });
  });

  it('records 5xx push service failures without revoking the subscription', async () => {
    const store = createPushStore({
      findDuePushCandidates: vi.fn(async (window) => window.channel === 'web_push_t60' ? [{
        cardId: 'card-1',
        title: '오늘 21시 고날에프 1회',
        scheduledAt: '2026-05-11T12:00:00.000Z',
        recipientEmail: 'user@example.com',
        pushSubscriptions: [{ endpoint: 'https://push.example.test/active', keys: { p256dh: 'key', auth: 'auth' } }],
      }] : []),
    });
    const pusher = createPusher({
      send: vi.fn().mockRejectedValue(new ReminderPushDeliveryFailure('push_service_5xx_503')),
    });

    const result = await dispatchDuePushReminders({ store, pusher, now: NOW, appUrl: 'https://project-oznp0.vercel.app' });

    expect(store.revokePushSubscription).not.toHaveBeenCalled();
    expect(store.markPushDispatchFailed).toHaveBeenCalledWith({
      dispatchId: 'dispatch-1',
      failureReason: 'push_service_5xx_503',
    });
    expect(result).toEqual({ candidates: 1, sent: 0, skipped: 0, failed: 1 });
  });

  it('does not retry a failed 5xx dispatch before the next reminder window attempts normally', async () => {
    const dueCandidate = {
      cardId: 'card-1',
      title: '오늘 21시 고날에프 1회',
      scheduledAt: '2026-05-11T12:00:00.000Z',
      recipientEmail: 'user@example.com',
      pushSubscriptions: [{ endpoint: 'https://push.example.test/active', keys: { p256dh: 'key', auth: 'auth' } }],
    };
    const store = createPushStore({
      findDuePushCandidates: vi.fn(async (window) => {
        if (window.channel === 'web_push_t60' && window.startsAt === '2026-05-11T11:55:00.000Z') return [dueCandidate];
        if (window.channel === 'web_push_t15' && window.startsAt === '2026-05-11T11:55:00.000Z') return [dueCandidate];
        return [];
      }),
      claimPushDispatch: vi.fn(async (input) => ({ claimed: true, dispatchId: `dispatch-${input.channel}` })),
    });
    const pusher = createPusher({
      send: vi.fn()
        .mockRejectedValueOnce(new ReminderPushDeliveryFailure('push_service_5xx_503'))
        .mockResolvedValueOnce({ providerMessageId: 'push-t15' }),
    });

    const failedT60 = await dispatchDuePushReminders({
      store,
      pusher,
      now: new Date('2026-05-11T11:00:00.000Z'),
      appUrl: 'https://project-oznp0.vercel.app',
    });
    const sentT15 = await dispatchDuePushReminders({
      store,
      pusher,
      now: new Date('2026-05-11T11:45:00.000Z'),
      appUrl: 'https://project-oznp0.vercel.app',
    });

    expect(pusher.send).toHaveBeenCalledTimes(2);
    expect(store.claimPushDispatch).toHaveBeenCalledWith({
      cardId: 'card-1',
      scheduledAt: '2026-05-11T12:00:00.000Z',
      channel: 'web_push_t60',
    });
    expect(store.claimPushDispatch).toHaveBeenCalledWith({
      cardId: 'card-1',
      scheduledAt: '2026-05-11T12:00:00.000Z',
      channel: 'web_push_t15',
    });
    expect(store.markPushDispatchFailed).toHaveBeenCalledWith({
      dispatchId: 'dispatch-web_push_t60',
      failureReason: 'push_service_5xx_503',
    });
    expect(store.markPushDispatchSent).toHaveBeenCalledWith({
      dispatchId: 'dispatch-web_push_t15',
      providerMessageId: 'push-t15',
    });
    expect(failedT60).toEqual({ candidates: 1, sent: 0, skipped: 0, failed: 1 });
    expect(sentT15).toEqual({ candidates: 1, sent: 1, skipped: 0, failed: 0 });
  });

});
