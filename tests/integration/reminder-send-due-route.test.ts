import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../app/api/reminders/send-due/route';
import { createSupabaseServiceRoleClient } from '../../src/lib/server-supabase-admin';

vi.mock('../../src/lib/server-supabase-admin', () => ({
  createSupabaseServiceRoleClient: vi.fn(),
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
        recipient_email: 'user@example.com',
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
    vi.stubEnv('REMINDER_DISPATCH_SECRET', 'test-secret');
    vi.stubEnv('RESEND_API_KEY', 'resend-test-key');
    vi.stubEnv('REMINDER_FROM_EMAIL', 'Fevio <reminders@example.com>');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://project-oznp0.vercel.app');
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'msg-1' }),
    }) as never;
  });

  it('dispatches due reminders once through service role and Resend', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockReturnValue(supabase as never);

    const response = await GET(request());
    const payload = (await response.json()) as { result: { candidates: number; sent: number; skipped: number; failed: number } };

    expect(response.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('get_due_email_reminder_candidates', {
      p_window_start: '2026-05-11T11:59:00.000Z',
      p_window_end: '2026-05-11T12:01:00.000Z',
    });
    expect(supabase.insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      card_id: 'card-1',
      scheduled_at: '2026-05-11T12:00:00.000Z',
      channel: 'email',
      status: 'queued',
      recipient_email: 'user@example.com',
    }));
    expect(global.fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer resend-test-key' }),
      body: expect.stringContaining('오늘 21시 고날에프 1회'),
    }));
    expect(supabase.updateChain.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'sent',
      provider_message_id: 'msg-1',
      sent_at: expect.any(String),
    }));
    expect(payload.result).toEqual({ candidates: 1, sent: 1, skipped: 0, failed: 0 });
  });

  it('rejects unauthenticated scheduler calls', async () => {
    const response = await GET(request('wrong-secret'));
    expect(response.status).toBe(401);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });
});
