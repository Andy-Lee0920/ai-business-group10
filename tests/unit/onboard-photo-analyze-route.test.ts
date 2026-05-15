import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type User = { id: string } | null;

type InsertCall = { table: string; rows: Array<Record<string, unknown>> };
type InvokeCall = { name: string; options: unknown };

const state = vi.hoisted(() => ({
  user: null as User,
  signedUrl: 'https://signed.example/photo',
  candidates: [] as Array<Record<string, unknown>>,
  insertCalls: [] as InsertCall[],
  invokeCalls: [] as InvokeCall[],
  signedCalls: [] as Array<{ bucket: string; path: string; expiresIn: number }>,
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

vi.mock('../../src/lib/server-supabase-admin', () => ({
  createSupabaseServiceRoleClient: () => ({
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (path: string, expiresIn: number) => {
          state.signedCalls.push({ bucket, path, expiresIn });
          return { data: { signedUrl: state.signedUrl }, error: null };
        },
      }),
    },
  }),
}));

function request(body: unknown) {
  return new NextRequest('http://localhost/api/onboard/photo-analyze', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/onboard/photo-analyze', () => {
  beforeEach(() => {
    state.user = null;
    state.signedUrl = 'https://signed.example/photo';
    state.candidates = [];
    state.insertCalls = [];
    state.invokeCalls = [];
    state.signedCalls = [];
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
    expect(state.insertCalls[0].rows[0]).toMatchObject({ patient_id: 'patient-1', image_path: 'patient-1/photo.jpg', raw_text: null, status: 'draft' });
  });

  it('returns empty candidates for zero extraction results without inserting', async () => {
    state.user = { id: 'patient-1' };
    const { POST } = await import('../../app/api/onboard/photo-analyze/route');

    const response = await POST(request({ imagePath: 'patient-1/photo.jpg' }));
    const payload = await response.json() as { candidates: unknown[] };

    expect(payload).toEqual({ candidates: [] });
    expect(state.insertCalls).toHaveLength(0);
  });
});
