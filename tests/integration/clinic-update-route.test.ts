import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type InsertCall = { table: string; values: unknown };

const userResponses = vi.hoisted((): UserResponse[] => []);
const insertCalls = vi.hoisted((): InsertCall[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    from: (table: string) => ({
      insert: (values: unknown) => {
        insertCalls.push({ table, values });
        return { error: null };
      },
    }),
  }),
}));

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/clinic-update', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('clinic update route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    insertCalls.length = 0;
  });

  it('persists a clinic update and emits clinic-update schedule items for Home and Records', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/clinic-update/route');

    const response = await POST(postRequest({
      sameMedication: false,
      addedMedicationIds: ['gonal-f'],
      medicationDays: 2,
      nextVisitAt: '2026-05-16T00:00:00.000Z',
      triggerPlan: 'tomorrow',
      memo: '다음 방문 전까지 유지',
      newScheduleItems: [
        {
          medicationId: null,
          type: 'clinic',
          title: '다음 병원 방문',
          dose: null,
          unit: null,
          scheduledAt: '2026-05-16T09:00:00.000',
        },
        {
          medicationId: 'gonal-f',
          type: 'medication',
          title: '고날에프',
          dose: null,
          unit: 'IU',
          scheduledAt: '2026-05-16T09:00:00.000',
        },
      ],
    }));

    expect(response.status).toBe(200);
    expect(insertCalls[0]).toMatchObject({
      table: 'clinic_updates',
      values: {
        patient_id: 'patient-1',
        same_medication: false,
        added_medication_ids: ['gonal-f'],
        medication_days: 2,
        next_visit_at: '2026-05-16T00:00:00.000Z',
        trigger_plan: 'tomorrow',
        memo: '다음 방문 전까지 유지',
      },
    });
    expect(insertCalls[1]).toMatchObject({ table: 'schedule_items' });
    expect(insertCalls[1].values).toEqual([
      expect.objectContaining({
        patient_id: 'patient-1',
        medication_id: null,
        type: 'clinic',
        title: '다음 병원 방문',
        source: 'clinic_update',
      }),
      expect.objectContaining({
        patient_id: 'patient-1',
        medication_id: 'gonal-f',
        type: 'medication',
        title: '고날에프',
        source: 'clinic_update',
      }),
    ]);
  });
});
