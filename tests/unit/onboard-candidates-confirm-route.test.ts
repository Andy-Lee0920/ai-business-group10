import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type User = { id: string } | null;
type Candidate = { id: string; patient_id: string; type: 'injection' | 'medication' | 'clinic'; title: string; scheduled_at: string | null; dose: string | null; unit: string | null };

const state = vi.hoisted(() => ({
  user: null as User,
  ownedCandidates: [] as Candidate[],
  insertedRows: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ table: string; values: unknown; ids: string[]; patientId: string }>,
}));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from: (table: string) => {
      if (table === 'schedule_candidates') {
        return {
          select: () => ({
            in: (_column: string, ids: string[]) => ({
              eq: async (_patientColumn: string, patientId: string) => ({
                data: state.ownedCandidates.filter((candidate) => ids.includes(candidate.id) && candidate.patient_id === patientId),
                error: null,
              }),
            }),
          }),
          update: (values: unknown) => ({
            in: (_column: string, ids: string[]) => ({
              eq: async (_patientColumn: string, patientId: string) => {
                state.updates.push({ table, values, ids, patientId });
                return { error: null };
              },
            }),
          }),
        };
      }
      return {
        insert: (rows: Array<Record<string, unknown>>) => ({
          select: async () => {
            state.insertedRows = rows;
            return { data: rows.map((row, index) => ({ id: `item-${index + 1}`, status: 'upcoming', created_at: 'now', ...row })), error: null };
          },
        }),
      };
    },
  }),
}));

function request(body: unknown) {
  return new NextRequest('http://localhost/api/onboard/candidates/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/onboard/candidates/confirm', () => {
  beforeEach(() => {
    state.user = null;
    state.ownedCandidates = [];
    state.insertedRows = [];
    state.updates = [];
  });

  it('returns 401 without auth', async () => {
    const { POST } = await import('../../app/api/onboard/candidates/confirm/route');
    const response = await POST(request({ confirmedIds: ['candidate-1'], rejectedIds: [] }));
    expect(response.status).toBe(401);
  });

  it('returns 403 when any requested candidate is not owned by the current user', async () => {
    state.user = { id: 'patient-1' };
    state.ownedCandidates = [];
    const { POST } = await import('../../app/api/onboard/candidates/confirm/route');

    const response = await POST(request({ confirmedIds: ['other-candidate'], rejectedIds: [] }));

    expect(response.status).toBe(403);
    expect(state.insertedRows).toHaveLength(0);
  });

  it('copies confirmed candidates into schedule_items with source capture and marks rejected rows', async () => {
    state.user = { id: 'patient-1' };
    state.ownedCandidates = [
      { id: 'candidate-1', patient_id: 'patient-1', type: 'injection', title: '고날에프', scheduled_at: '2026-05-15T12:00:00.000Z', dose: '150', unit: 'IU' },
      { id: 'candidate-2', patient_id: 'patient-1', type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-16T00:00:00.000Z', dose: null, unit: null },
    ];
    const { POST } = await import('../../app/api/onboard/candidates/confirm/route');

    const response = await POST(request({ confirmedIds: ['candidate-1'], rejectedIds: ['candidate-2'] }));
    const payload = await response.json() as { savedCount: number; items: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.savedCount).toBe(1);
    expect(state.insertedRows).toEqual([
      expect.objectContaining({ patient_id: 'patient-1', type: 'injection', title: '고날에프', source: 'capture' }),
    ]);
    expect(state.updates).toEqual([
      expect.objectContaining({ values: { status: 'confirmed' }, ids: ['candidate-1'], patientId: 'patient-1' }),
      expect.objectContaining({ values: { status: 'rejected' }, ids: ['candidate-2'], patientId: 'patient-1' }),
    ]);
  });
});
