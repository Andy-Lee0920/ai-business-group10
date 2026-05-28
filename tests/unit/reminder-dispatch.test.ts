import { describe, expect, it } from 'vitest';
import {
  buildReminderEmail,
  buildReminderPushPayload,
  getReminderWindow,
  getReminderPushWindows,
  shouldDispatchReminder,
  type ReminderCandidate,
} from '../../src/domain/reminder-dispatch';

const NOW = new Date('2026-05-11T11:30:00.000Z');

function candidate(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    cardId: 'card-1',
    title: '오늘 21시 고날에프 1회',
    cardType: 'injection',
    scheduledAt: '2026-05-11T12:00:00.000Z',
    recipientEmail: 'user@example.com',
    ...overrides,
  };
}

describe('reminder dispatch domain', () => {
  it('selects confirmed injection reminders in the 30-minute email window', () => {
    expect(shouldDispatchReminder(candidate(), NOW)).toBe(true);
    expect(shouldDispatchReminder(candidate({ scheduledAt: '2026-05-11T12:01:01.000Z' }), NOW)).toBe(false);
    expect(shouldDispatchReminder(candidate({ scheduledAt: '2026-05-11T11:58:59.000Z' }), NOW)).toBe(false);
  });

  it('computes a narrow scheduler window for the legacy 30-minute email reminder', () => {
    expect(getReminderWindow(NOW)).toEqual({
      startsAt: '2026-05-11T11:59:00.000Z',
      endsAt: '2026-05-11T12:01:00.000Z',
    });
  });



  it('computes T-60 and T-15 push windows with five-minute sweep tolerance for scheduler jitter', () => {
    expect(getReminderPushWindows(NOW)).toEqual([
      {
        channel: 'web_push_t60',
        offsetMinutes: 60,
        startsAt: '2026-05-11T12:25:00.000Z',
        endsAt: '2026-05-11T12:35:00.000Z',
      },
      {
        channel: 'web_push_t15',
        offsetMinutes: 15,
        startsAt: '2026-05-11T11:40:00.000Z',
        endsAt: '2026-05-11T11:50:00.000Z',
      },
    ]);
  });

  it('builds a safe web push payload with only card title, scheduled time, and /home deep link', () => {
    const payload = buildReminderPushPayload({
      candidate: candidate({ title: '오비트렐 · 250mcg · 22:00' }),
      appUrl: 'https://project-oznp0.vercel.app',
    });

    expect(payload).toEqual({
      title: '오비트렐 · 250mcg · 22:00',
      body: '예정 시간: 2026. 5. 11. 오후 9:00',
      url: '/home',
      tag: 'fevio-reminder-card-1',
    });
    expect(JSON.stringify(payload)).not.toMatch(/투여하세요|복용하세요|판단|source_text|raw memo|원문/u);
  });

  it('builds deterministic Korean email copy without medical advice or raw memo text', () => {
    const email = buildReminderEmail({
      candidate: candidate({ title: '오비트렐 · 250mcg · 22:00' }),
      appUrl: 'https://project-oznp0.vercel.app',
    });

    expect(email.subject).toBe('[Fevio] 확인할 주사 시간이 가까워졌어요');
    expect(email.text).toContain('오비트렐 · 250mcg · 22:00');
    expect(email.text).toContain('2026. 5. 11. 오후 9:00');
    expect(email.text).toContain('https://project-oznp0.vercel.app/home');
    expect(email.text).not.toMatch(/투여하세요|복용하세요|판단|source_text|raw memo|원문/u);
  });

  it('branches medication email subject without injection copy', () => {
    const email = buildReminderEmail({
      candidate: candidate({ cardType: 'medication', title: '듀파스톤 복용' }),
      appUrl: 'https://project-oznp0.vercel.app',
    });

    expect(email.subject).toBe('[Fevio] 확인할 복약 시간이 가까워졌어요');
    expect(email.subject).not.toContain('주사');
  });
});
