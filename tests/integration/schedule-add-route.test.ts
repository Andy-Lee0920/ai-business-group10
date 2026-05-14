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
        const selected = {
          data: values,
          error: null,
          single: () => ({
            data: Array.isArray(values) ? values[0] : values,
            error: null,
          }),
        };
        return { select: () => selected };
      },
    }),
  }),
}));

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/schedule/add', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/schedule/add', () => {
  beforeEach(() => {
    userResponses.length = 0;
    insertCalls.length = 0;
  });

  it('keeps the existing single schedule insert contract', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/schedule/add/route');

    const response = await POST(postRequest({
      type: 'injection',
      title: '고날에프',
      dose: '150',
      unit: 'IU',
      scheduledAt: '2026-05-15T12:00:00.000Z',
      medicationId: 'gonal-f',
    }));

    expect(response.status).toBe(200);
    expect(insertCalls[0]).toMatchObject({
      table: 'schedule_items',
      values: {
        patient_id: 'patient-1',
        title: '고날에프',
        scheduled_at: '2026-05-15T12:00:00.000Z',
        medication_id: 'gonal-f',
        source: 'manual',
      },
    });
  });

  it('bulk inserts one schedule item per KST day for range repeat', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/schedule/add/route');

    const response = await POST(postRequest({
      type: 'injection',
      title: '고날에프',
      dose: '150',
      unit: 'IU',
      startDate: '2026-05-15',
      endDate: '2026-05-19',
      dailyTime: '21:00',
      medicationId: 'gonal-f',
    }));

    expect(response.status).toBe(200);
    const rows = insertCalls[0]?.values;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(5);
    expect(rows).toEqual([
      expect.objectContaining({ scheduled_at: '2026-05-15T12:00:00.000Z' }),
      expect.objectContaining({ scheduled_at: '2026-05-16T12:00:00.000Z' }),
      expect.objectContaining({ scheduled_at: '2026-05-17T12:00:00.000Z' }),
      expect.objectContaining({ scheduled_at: '2026-05-18T12:00:00.000Z' }),
      expect.objectContaining({ scheduled_at: '2026-05-19T12:00:00.000Z' }),
    ]);
  });

  it('rejects range repeats longer than 30 days', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/schedule/add/route');

    const response = await POST(postRequest({
      type: 'injection',
      title: '고날에프',
      startDate: '2026-05-01',
      endDate: '2026-06-01',
      dailyTime: '21:00',
    }));
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain('30일');
    expect(insertCalls).toHaveLength(0);
  });
});
