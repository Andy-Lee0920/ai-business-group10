import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type User = { id: string } | null;
type InsertCall = { table: string; rows: Array<Record<string, unknown>> };
type InvokeCall = { name: string; options: unknown };

const state = vi.hoisted(() => ({
  user: null as User,
  candidates: [] as Array<Record<string, unknown>>,
  insertCalls: [] as InsertCall[],
  invokeCalls: [] as InvokeCall[],
}));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    functions: {
      invoke: async (name: string, options: unknown) => {
        state.invokeCalls.push({ name, options });
        return { data: { candidates: state.candidates }, error: null };
      },
    },
    from: (table: string) => ({
      insert: (rows: Array<Record<string, unknown>>) => ({
        select: async () => {
          state.insertCalls.push({ table, rows });
          return { data: rows.map((row, index) => ({ id: `candidate-${index + 1}`, ...row })), error: null };
        },
      }),
    }),
  }),
}));

function request(body: unknown) {
  return new NextRequest('http://localhost/api/onboard/text-analyze', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/onboard/text-analyze', () => {
  beforeEach(() => {
    vi.useRealTimers();
    state.user = null;
    state.candidates = [];
    state.insertCalls = [];
    state.invokeCalls = [];
  });

  it('returns 401 without auth', async () => {
    const { POST } = await import('../../app/api/onboard/text-analyze/route');
    const response = await POST(request({ rawText: '고날에프 21:00' }));
    expect(response.status).toBe(401);
  });

  it('calls text mode extraction and inserts draft candidates with raw text and no image path', async () => {
    state.user = { id: 'patient-1' };
    state.candidates = [{ type: 'injection', title: '고날에프', scheduled_at: '2026-05-15T12:00:00.000Z', dose: '150', unit: 'IU' }];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: ' 고날에프 150 IU 21:00 ' }));
    const payload = await response.json() as { candidates: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(1);
    expect(state.invokeCalls[0]).toMatchObject({
      name: 'schedule-extract',
      options: { body: { mode: 'text', rawText: '고날에프 150 IU 21:00', patientId: 'patient-1' } },
    });
    expect(state.insertCalls[0]).toMatchObject({
      table: 'schedule_candidates',
      rows: [expect.objectContaining({ patient_id: 'patient-1', image_path: null, raw_text: '고날에프 150 IU 21:00', status: 'draft' })],
    });
  });


  it('falls back to deterministic Korean injection extraction when LLM returns no candidates', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    state.user = { id: 'patient-1' };
    state.candidates = [];
    const { POST } = await import('../../app/api/onboard/text-analyze/route');

    const response = await POST(request({ rawText: '오늘 밤 부터 고날에프 17시 한번 09시 한번 10일간 맞아야한대' }));
    const payload = await response.json() as { candidates: Array<{ title: string; type: string; scheduled_at: string | null }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(2);
    expect(payload.candidates.map((candidate) => candidate.title)).toEqual(['고날에프', '고날에프']);
    expect(payload.candidates.map((candidate) => candidate.type)).toEqual(['injection', 'injection']);
    expect(payload.candidates.map((candidate) => candidate.scheduled_at)).toEqual([
      '2026-05-15T08:00:00.000Z',
      '2026-05-15T00:00:00.000Z',
    ]);
    expect(state.insertCalls[0]).toMatchObject({
      table: 'schedule_candidates',
      rows: [
        expect.objectContaining({ patient_id: 'patient-1', image_path: null, raw_text: '오늘 밤 부터 고날에프 17시 한번 09시 한번 10일간 맞아야한대', status: 'draft', type: 'injection', title: '고날에프' }),
        expect.objectContaining({ patient_id: 'patient-1', image_path: null, raw_text: '오늘 밤 부터 고날에프 17시 한번 09시 한번 10일간 맞아야한대', status: 'draft', type: 'injection', title: '고날에프' }),
      ],
    });
    vi.useRealTimers();
  });

  it('returns an empty candidate array without inserting when extraction finds nothing', async () => {
    state.user = { id: 'patient-1' };
    const { POST } = await import('../../app/api/onboard/text-analyze/route');
    const response = await POST(request({ rawText: '일정 없음' }));
    const payload = await response.json() as { candidates: unknown[] };

    expect(payload).toEqual({ candidates: [] });
    expect(state.insertCalls).toHaveLength(0);
  });
});
