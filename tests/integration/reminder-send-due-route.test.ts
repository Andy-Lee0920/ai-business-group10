import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../app/api/reminders/send-due/route';
import { createSupabaseServiceRoleClient } from '../../src/lib/server-supabase-admin';

vi.mock('../../src/lib/server-supabase-admin', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));


const setVapidDetailsMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: setVapidDetailsMock,
    sendNotification: sendNotificationMock,
  },
}));

const mockedCreateSupabase = vi.mocked(createSupabaseServiceRoleClient);

type PushRow = {
  card_id: string;
  title: string;
  scheduled_at: string;
  push_subscriptions: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }[];
};

type DispatchInsert = {
  card_id: string;
  scheduled_at: string;
  channel: string;
  status: string;
};

function bearerRequest(secret = 'test-secret') {
  return new NextRequest('http://localhost/api/reminders/send-due', {
    headers: { authorization: `Bearer ${secret}` },
  });
}

function requestWithAuthorization(authorization?: string) {
  return new NextRequest('http://localhost/api/reminders/send-due', {
    headers: authorization ? { authorization } : {},
  });
}

const defaultPushRow: PushRow = {
  card_id: 'card-1',
  title: '오늘 21시 고날에프 1회',
  scheduled_at: '2026-05-11T12:00:00.000Z',
  push_subscriptions: [
    { endpoint: 'https://push.example.test/1', keys: { p256dh: 'key-material', auth: 'auth-material' } },
  ],
};

function rowsForChannel(rows: { web_push_t60?: PushRow[]; web_push_t15?: PushRow[] } | undefined, channel: unknown) {
  if (channel === 'web_push_t60') return rows?.web_push_t60 ?? [defaultPushRow];
  if (channel === 'web_push_t15') return rows?.web_push_t15 ?? [defaultPushRow];
  return [];
}

function createSupabaseMock(options: { rows?: { web_push_t60?: PushRow[]; web_push_t15?: PushRow[] }; enforceUnique?: boolean } = {}) {
  const claimedDispatches = new Set<string>();
  let pendingInsert: DispatchInsert | null = null;
  const rpc = vi.fn(async (_name: string, args?: { p_channel?: string }) => ({
    data: rowsForChannel(options.rows, args?.p_channel),
    error: null,
  }));
  const insertChain = {
    insert: vi.fn((value: DispatchInsert) => {
      pendingInsert = value;
      return insertChain;
    }),
    select: vi.fn(() => insertChain),
    single: vi.fn(async () => {
      if (!pendingInsert) return { data: null, error: { message: 'missing dispatch insert' } };
      const key = `${pendingInsert.card_id}|${pendingInsert.scheduled_at}|${pendingInsert.channel}`;
      if (options.enforceUnique && claimedDispatches.has(key)) {
        return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "reminder_dispatches_card_time_channel_unique"' } };
      }
      claimedDispatches.add(key);
      return { data: { id: `dispatch-${claimedDispatches.size}` }, error: null };
    }),
  };
  const updateChain = {
    update: vi.fn(() => updateChain),
    eq: vi.fn(() => updateChain),
  };
  const from = vi.fn((table: string) => (table === 'reminder_dispatches' ? { ...insertChain, ...updateChain } : null));
  return { rpc, from, insertChain, updateChain };
}

describe('/api/reminders/send-due', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T11:30:00.000Z'));
    vi.unstubAllEnvs();
    vi.stubEnv('CRON_SECRET', 'test-secret');
    vi.stubEnv('VAPID_PUBLIC_KEY', 'public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:reminders@example.com');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://project-oznp0.vercel.app');
    vi.clearAllMocks();
    sendNotificationMock.mockResolvedValue({ statusCode: 201, headers: { location: 'push-message-1' } });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as never;
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('dispatches due reminders once through service role and Web Push, not Resend', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockReturnValue(supabase as never);

    const response = await GET(bearerRequest());
    const payload = (await response.json()) as { result: { candidates: number; sent: number; skipped: number; failed: number } };

    expect(response.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('get_due_web_push_reminder_candidates', {
      p_window_start: '2026-05-11T12:25:00.000Z',
      p_window_end: '2026-05-11T12:35:00.000Z',
      p_channel: 'web_push_t60',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('get_due_web_push_reminder_candidates', {
      p_window_start: '2026-05-11T11:40:00.000Z',
      p_window_end: '2026-05-11T11:50:00.000Z',
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

  it('allows POST when the Bearer token matches CRON_SECRET', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockReturnValue(supabase as never);

    const response = await POST(bearerRequest());

    expect(response.status).toBe(200);
    expect(mockedCreateSupabase).toHaveBeenCalled();
  });

  it('keeps duplicate send-due calls to one T-15 dispatch row', async () => {
    const supabase = createSupabaseMock({
      rows: {
        web_push_t60: [],
        web_push_t15: [defaultPushRow],
      },
      enforceUnique: true,
    });
    mockedCreateSupabase.mockReturnValue(supabase as never);

    const firstResponse = await POST(bearerRequest());
    const secondResponse = await POST(bearerRequest());
    const firstPayload = (await firstResponse.json()) as { result: { candidates: number; sent: number; skipped: number; failed: number } };
    const secondPayload = (await secondResponse.json()) as { result: { candidates: number; sent: number; skipped: number; failed: number } };

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(supabase.insertChain.insert).toHaveBeenCalledTimes(2);
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    expect(firstPayload.result).toEqual({ candidates: 1, sent: 1, skipped: 0, failed: 0 });
    expect(secondPayload.result).toEqual({ candidates: 1, sent: 0, skipped: 1, failed: 0 });
  });

  it('rejects missing Authorization with a structured non-PII log', async () => {
    const response = await POST(requestWithAuthorization());

    expect(response.status).toBe(401);
    expect(warnSpy).toHaveBeenCalledWith({ event: 'reminder_dispatch.auth_rejected', reason: 'missing_authorization' });
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });

  it('rejects malformed Authorization with a structured non-PII log', async () => {
    const response = await POST(requestWithAuthorization('Token test-secret'));

    expect(response.status).toBe(401);
    expect(warnSpy).toHaveBeenCalledWith({ event: 'reminder_dispatch.auth_rejected', reason: 'malformed_authorization' });
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });

  it('rejects the wrong Bearer token with a structured non-PII log', async () => {
    const response = await POST(bearerRequest('wrong-secret'));

    expect(response.status).toBe(401);
    expect(warnSpy).toHaveBeenCalledWith({ event: 'reminder_dispatch.auth_rejected', reason: 'invalid_token' });
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });

  it('rejects scheduler calls when CRON_SECRET is not configured', async () => {
    vi.unstubAllEnvs();
    const response = await POST(bearerRequest());

    expect(response.status).toBe(401);
    expect(warnSpy).toHaveBeenCalledWith({ event: 'reminder_dispatch.auth_rejected', reason: 'cron_secret_unconfigured' });
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });
});
