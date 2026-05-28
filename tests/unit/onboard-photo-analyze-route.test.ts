import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type User = { id: string } | null;

type InsertCall = { table: string; rows: Array<Record<string, unknown>> };
type InvokeCall = { name: string; options: unknown };
type OffsetCandidateRow = {
  source_text?: unknown;
  source_offset_start?: unknown;
  source_offset_end?: unknown;
};

const state = vi.hoisted(() => ({
  user: null as User,
  signedUrl: 'https://signed.example/photo',
  candidates: [] as Array<Record<string, unknown>>,
  insertCalls: [] as InsertCall[],
  invokeCalls: [] as InvokeCall[],
  signedCalls: [] as Array<{ bucket: string; path: string; expiresIn: number }>,
  removeCalls: [] as Array<{ bucket: string; paths: string[] }>,
}));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    rpc: async () => ({ data: { couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-10T00:00:00.000Z' }, error: null }),
    functions: {
      invoke: async (name: string, options: unknown) => {
        state.invokeCalls.push({ name, options });
        return { data: { candidates: state.candidates }, error: null };
      },
    },
    from: (table: string) => ({
      insert: (rows: Array<Record<string, unknown>>) => ({
        select: () => {
          const normalizedRows = Array.isArray(rows) ? rows : [rows];
          state.insertCalls.push({ table, rows: normalizedRows });
          const data = normalizedRows.map((row, index) => ({ id: `${table}-${index + 1}`, ...row }));
          return {
            single: async () => ({ data: data[0] ?? null, error: null }),
            then: (resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) => resolve({ data, error: null }),
          };
        },
      }),
    }),
  }),
}));

vi.mock('../../src/lib/server-supabase-admin', () => ({
  createSupabaseServiceRoleClient: () => ({
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (path: string, expiresIn: number) => {
          state.signedCalls.push({ bucket, path, expiresIn });
          return { data: { signedUrl: state.signedUrl }, error: null };
        },
        remove: async (paths: string[]) => {
          state.removeCalls.push({ bucket, paths });
          return { data: {}, error: null };
        },
      }),
    },
  }),
}));

function request(body: unknown, init?: { url?: string; cookie?: string }) {
  const host = init?.url ? new URL(init.url).host : undefined;
  return new NextRequest(init?.url ?? 'http://localhost/api/onboard/photo-analyze', {
    method: 'POST',
    headers: {
      ...(host ? { host } : {}),
      ...(init?.cookie ? { cookie: init.cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function expectOffsetRoundTrip(rawText: unknown, row: OffsetCandidateRow) {
  expect(typeof rawText).toBe('string');
  expect(typeof row.source_text).toBe('string');
  expect(typeof row.source_offset_start).toBe('number');
  expect(typeof row.source_offset_end).toBe('number');
  if (
    typeof rawText === 'string'
    && typeof row.source_text === 'string'
    && typeof row.source_offset_start === 'number'
    && typeof row.source_offset_end === 'number'
  ) {
    expect(rawText.slice(row.source_offset_start, row.source_offset_end)).toBe(row.source_text);
  }
}

describe('/api/onboard/photo-analyze', () => {
  beforeEach(() => {
    state.user = null;
    state.signedUrl = 'https://signed.example/photo';
    state.candidates = [];
    state.insertCalls = [];
    state.invokeCalls = [];
    state.signedCalls = [];
    state.removeCalls = [];
  });

  it('returns 401 without auth', async () => {
    const { POST } = await import('../../app/api/onboard/photo-analyze/route');
    const response = await POST(request({ imagePath: 'patient-1/photo.jpg' }));
    expect(response.status).toBe(401);
  });

  it('signs the user-owned image path, invokes image extraction, and inserts image-backed draft candidates', async () => {
    state.user = { id: 'patient-1' };
    state.candidates = [{ type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-16T00:00:00.000Z', dose: null, unit: null }];
    const { POST } = await import('../../app/api/onboard/photo-analyze/route');

    const response = await POST(request({ imagePath: 'patient-1/photo.jpg' }));
    const payload = await response.json() as { candidates: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.candidates).toHaveLength(1);
    expect(state.signedCalls).toEqual([{ bucket: 'clinic-photos', path: 'patient-1/photo.jpg', expiresIn: 60 }]);
    expect(state.invokeCalls[0]).toMatchObject({
      name: 'schedule-extract',
      options: { body: { mode: 'image', imagePath: 'patient-1/photo.jpg', patientId: 'patient-1', signedUrl: 'https://signed.example/photo' } },
    });
    expect(state.insertCalls.map((call) => call.table)).toEqual(['visit_inputs', 'action_split_drafts', 'split_candidates']);
    expect(state.insertCalls[2].rows[0]).toMatchObject({
      couple_id: 'couple-1',
      draft_id: 'action_split_drafts-1',
      visit_input_id: 'visit_inputs-1',
      source_text: '병원 방문',
      assigned_to: 'my_action',
      suggested_card_type: 'clinic_visit',
      confidence: 'needs_confirmation',
    });
    expectOffsetRoundTrip(state.insertCalls[0].rows[0].raw_text, state.insertCalls[2].rows[0]);
  });

  it('allows presentation image extraction after privacy acceptance without persisting drafts', async () => {
    state.user = null;
    state.candidates = [{ type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-16T00:00:00.000Z', dose: null, unit: null }];
    const { POST } = await import('../../app/api/onboard/photo-analyze/route');

    const response = await POST(request(
      { imagePath: 'presentation/photo.jpg' },
      {
        url: 'https://ai-business-group10.vercel.app/api/onboard/photo-analyze',
        cookie: 'fevio_privacy_gate_v1=accepted',
      },
    ));
    const payload = await response.json() as { candidates: Array<{ id: string; title: string }> };

    expect(response.status).toBe(200);
    expect(payload.candidates[0]).toMatchObject({ id: expect.stringMatching(/^presentation-/u), title: '병원 방문' });
    expect(state.invokeCalls[0]).toMatchObject({
      name: 'schedule-extract',
      options: { body: { mode: 'image', imagePath: 'presentation/photo.jpg', patientId: 'presentation', signedUrl: 'https://signed.example/photo' } },
    });
    expect(state.insertCalls).toHaveLength(0);
    expect(state.removeCalls).toEqual([{ bucket: 'clinic-photos', paths: ['presentation/photo.jpg'] }]);
  });

  it('returns empty candidates for zero extraction results without inserting', async () => {
    state.user = { id: 'patient-1' };
    const { POST } = await import('../../app/api/onboard/photo-analyze/route');

    const response = await POST(request({ imagePath: 'patient-1/photo.jpg' }));
    const payload = await response.json() as { candidates: unknown[] };

    expect(payload).toEqual({ candidates: [] });
    expect(state.insertCalls).toHaveLength(0);
  });

  it('drops extracted image candidates that contain medical advice language before draft persistence', async () => {
    state.user = { id: 'patient-1' };
    state.candidates = [{ type: 'medication', title: '용량을 늘리세요', scheduled_at: null, dose: null, unit: null }];
    const { POST } = await import('../../app/api/onboard/photo-analyze/route');

    const response = await POST(request({ imagePath: 'patient-1/photo.jpg' }));
    const payload = await response.json() as { candidates: unknown[] };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ candidates: [] });
    expect(state.insertCalls).toHaveLength(0);
  });
});
