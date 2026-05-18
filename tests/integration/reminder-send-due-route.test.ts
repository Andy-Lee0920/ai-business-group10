import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../app/api/reminders/send-due/route';
import { createSupabaseServiceRoleClient } from '../../src/lib/server-supabase-admin';

vi.mock('../../src/lib/server-supabase-admin', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));


vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201, headers: { location: 'push-message-1' } }),
  },
}));

const mockedCreateSupabase = vi.mocked(createSupabaseServiceRoleClient);

function request(secret = 'test-secret') {
  return new NextRequest('http://localhost/api/reminders/send-due', {
    headers: { authorization: `Bearer ${secret}` },
  });
}

function createSupabaseMock() {
  const rpc = vi.fn().mockResolvedValue({
    data: [
      {
        card_id: 'card-1',
        title: '오늘 21시 고날에프 1회',
        scheduled_at: '2026-05-11T12:00:00.000Z',
        push_subscriptions: [
          { endpoint: 'https://push.example.test/1', keys: { p256dh: 'key-material', auth: 'auth-material' } },
        ],
      },
    ],
    error: null,
  });
  const insertChain = {
    insert: vi.fn(() => insertChain),
    select: vi.fn(() => insertChain),
    single: vi.fn().mockResolvedValue({ data: { id: 'dispatch-1' }, error: null }),
  };
  const updateChain = {
    update: vi.fn(() => updateChain),
    eq: vi.fn(() => updateChain),
  };
  const from = vi.fn((table: string) => (table === 'reminder_dispatches' ? { ...insertChain, ...updateChain } : null));
  return { rpc, from, insertChain, updateChain };
}

describe('/api/reminders/send-due', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T11:30:00.000Z'));
    vi.unstubAllEnvs();
    vi.stubEnv('REMINDER_DISPATCH_SECRET', 'test-secret');
    vi.stubEnv('VAPID_PUBLIC_KEY', 'public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:reminders@example.com');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://project-oznp0.vercel.app');
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as never;
  });

  it('dispatches due reminders once through service role and Web Push, not Resend', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockReturnValue(supabase as never);

    const response = await GET(request());
    const payload = (await response.json()) as { result: { candidates: number; sent: number; skipped: number; failed: number } };

    expect(response.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('get_due_web_push_reminder_candidates', {
      p_window_start: '2026-05-11T12:29:00.000Z',
      p_window_end: '2026-05-11T12:31:00.000Z',
      p_channel: 'web_push_t60',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('get_due_web_push_reminder_candidates', {
      p_window_start: '2026-05-11T11:44:00.000Z',
      p_window_end: '2026-05-11T11:46:00.000Z',
      p_channel: 'web_push_t15',
    });
    expect(supabase.insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      card_id: 'card-1',
      scheduled_at: '2026-05-11T12:00:00.000Z',
      channel: 'web_push_t60',
      status: 'queued',
    }));
    expect(global.fetch).not.toHaveBeenCalledWith('https://api.resend.com/emails', expect.anything());
    expect(supabase.updateChain.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'sent',
      provider_message_id: expect.any(String),
      sent_at: expect.any(String),
    }));
    expect(payload.result).toEqual({ candidates: 2, sent: 2, skipped: 0, failed: 0 });
  });

  it('accepts CRON_SECRET even when legacy REMINDER_DISPATCH_SECRET is also configured', async () => {
    vi.stubEnv('REMINDER_DISPATCH_SECRET', 'legacy-secret');
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockReturnValue(supabase as never);

    const response = await GET(request('cron-secret'));

    expect(response.status).toBe(200);
    expect(mockedCreateSupabase).toHaveBeenCalled();
  });

  it('rejects unauthenticated scheduler calls', async () => {
    const response = await GET(request('wrong-secret'));
    expect(response.status).toBe(401);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });
});
