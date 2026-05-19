import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type User = { id: string } | null;
const isPresentationRequest = vi.hoisted(() => vi.fn(() => false));
type Candidate = { id: string; couple_id: string; draft_id: string; visit_input_id: string; source_text: string; suggested_card_type: 'injection' | 'medication' | 'clinic_visit' | null };

const state = vi.hoisted(() => ({
  user: null as User,
  ownedCandidates: [] as Candidate[],
  insertedRows: [] as Array<Record<string, unknown>>,
  rpcCalls: [] as Array<{ name: string; args: Record<string, unknown> }>,
}));

vi.mock('../../src/config', () => ({ isPresentationRequest }));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      return { data: null, error: null };
    },
    from: (table: string) => {
      if (table === 'split_candidates') {
        return {
          select: () => ({
            in: async (_column: string, ids: string[]) => ({
              data: state.ownedCandidates.filter((candidate) => ids.includes(candidate.id)),
              error: null,
            }),
          }),
        };
      }
      return {
        insert: (rows: Array<Record<string, unknown>>) => ({
          select: async () => {
            state.insertedRows = rows;
            return { data: rows.map((row, index) => ({ id: `card-${index + 1}`, status: 'confirmed', created_at: 'now', ...row })), error: null };
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
    state.rpcCalls = [];
    isPresentationRequest.mockReturnValue(false);
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



  it('lets presentation onboarding confirm extracted candidates without a signed-in Supabase user', async () => {
    state.user = null;
    isPresentationRequest.mockReturnValue(true);
    const { POST } = await import('../../app/api/onboard/candidates/confirm/route');

    const response = await POST(new NextRequest('https://project-oznp0.vercel.app/api/onboard/candidates/confirm', {
      method: 'POST',
      headers: { cookie: 'fevio_privacy_gate_v1=accepted' },
      body: JSON.stringify({
        confirmedIds: ['presentation-1'],
        rejectedIds: ['presentation-2'],
        candidateEdits: [
          { id: 'presentation-1', type: 'injection', title: '고날에프', scheduled_at: '2026-05-15T12:00:00.000Z', dose: '150', unit: 'IU' },
          { id: 'presentation-2', type: 'clinic', title: '병원 방문', scheduled_at: null, dose: null, unit: null },
        ],
      }),
    }));
    const payload = await response.json() as { savedCount: number; items: Array<{ id: string; patient_id: string; title: string; source: string }> };

    expect(response.status).toBe(200);
    expect(payload.savedCount).toBe(1);
    expect(payload.items).toEqual([
      expect.objectContaining({ id: 'presentation-item-presentation-1', patient_id: 'presentation', title: '고날에프', source: 'capture' }),
    ]);
    expect(state.insertedRows).toHaveLength(0);
  });

  it('copies confirmed split candidates into care_action_cards and ignores rejected rows', async () => {
    state.user = { id: 'patient-1' };
    state.ownedCandidates = [
      { id: 'candidate-1', couple_id: 'couple-1', draft_id: 'draft-1', visit_input_id: 'visit-1', source_text: '고날에프', suggested_card_type: 'injection' },
      { id: 'candidate-2', couple_id: 'couple-1', draft_id: 'draft-1', visit_input_id: 'visit-1', source_text: '병원 방문', suggested_card_type: 'clinic_visit' },
    ];
    const { POST } = await import('../../app/api/onboard/candidates/confirm/route');

    const response = await POST(request({
      confirmedIds: ['candidate-1'],
      rejectedIds: ['candidate-2'],
      candidateEdits: [
        { id: 'candidate-1', type: 'injection', title: '고날에프', scheduled_at: '2026-05-15T12:00:00.000Z', dose: '150', unit: 'IU' },
        { id: 'candidate-2', type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-16T00:00:00.000Z', dose: null, unit: null },
      ],
    }));
    const payload = await response.json() as { savedCount: number; items: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.savedCount).toBe(1);
    expect(state.insertedRows).toEqual([
      expect.objectContaining({
        couple_id: 'couple-1',
        created_by: 'patient-1',
        source_input_id: 'visit-1',
        split_candidate_id: 'candidate-1',
        card_type: 'injection',
        title: '고날에프',
        description: '150 IU',
        source_text: '고날에프',
        scheduled_at: '2026-05-15T12:00:00.000Z',
        status: 'confirmed',
      }),
    ]);
    expect(state.rpcCalls).toEqual([{ name: 'mark_first_capture_completed', args: { p_couple_id: 'couple-1' } }]);
  });

  it('uses inline candidate edits when copying confirmed candidates into care_action_cards', async () => {
    state.user = { id: 'patient-1' };
    state.ownedCandidates = [
      { id: 'candidate-1', couple_id: 'couple-1', draft_id: 'draft-1', visit_input_id: 'visit-1', source_text: '고날에프', suggested_card_type: 'injection' },
    ];
    const { POST } = await import('../../app/api/onboard/candidates/confirm/route');

    const response = await POST(request({
      confirmedIds: ['candidate-1'],
      rejectedIds: [],
      candidateEdits: [
        { id: 'candidate-1', type: 'injection', title: '수정한 고날에프', scheduled_at: '2026-05-15T13:30:00.000Z', dose: '225', unit: 'IU' },
      ],
    }));

    expect(response.status).toBe(200);
    expect(state.insertedRows).toEqual([
      expect.objectContaining({
        created_by: 'patient-1',
        card_type: 'injection',
        title: '수정한 고날에프',
        description: '225 IU',
        scheduled_at: '2026-05-15T13:30:00.000Z',
        source_text: '고날에프',
      }),
    ]);
  });
});
