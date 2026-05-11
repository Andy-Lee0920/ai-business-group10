import { describe, expect, it, vi } from 'vitest';
import { dispatchDueEmailReminders, type ReminderDispatchStore, type ReminderMailer } from '../../src/services/reminder-dispatch-service';

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
