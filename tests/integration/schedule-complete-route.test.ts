import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserResponse = { data: { user: { id: string } | null }; error: { message: string } | null };
type UpdateCall = { table: string; values: Record<string, unknown>; filters: Array<[string, unknown]> };
type InsertCall = { table: string; values: Record<string, unknown> };
type UpdateResult = { data?: Record<string, unknown> | null; error?: { message: string; code?: string } | null };

const userResponses = vi.hoisted((): UserResponse[] => []);
const updateCalls = vi.hoisted((): UpdateCall[] => []);
const insertCalls = vi.hoisted((): InsertCall[] => []);
const updateResults = vi.hoisted((): Record<string, UpdateResult[]> => ({}));

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: async () => ({
    auth: {
      getUser: async () => userResponses.shift() ?? { data: { user: null }, error: null },
    },
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => {
        const call: UpdateCall = { table, values, filters: [] };
        updateCalls.push(call);
        const result = () => updateResults[table]?.shift() ?? { data: null, error: null };
        const builder = {
          get error() {
            return result().error ?? null;
          },
          eq(column: string, value: unknown) {
            call.filters.push([column, value]);
            return builder;
          },
          select() {
            return builder;
          },
          maybeSingle: async () => result(),
        };
        return builder;
      },
      insert: (values: Record<string, unknown>) => {
        insertCalls.push({ table, values });
        return { error: null };
      },
    }),
  }),
}));

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/schedule/complete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('schedule complete route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    updateCalls.length = 0;
    insertCalls.length = 0;
    for (const key of Object.keys(updateResults)) delete updateResults[key];
  });

  it('marks the canonical care action card completed before legacy schedule_items fallback', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    updateResults.care_action_cards = [{ data: { id: 'card-1' }, error: null }];
    const { POST } = await import('../../app/api/schedule/complete/route');

    const response = await POST(postRequest({ scheduleItemId: 'card-1', injectionSite: 'lower_right' }));

    expect(response.status).toBe(200);
    expect(updateCalls[0]).toMatchObject({
      table: 'care_action_cards',
      values: { status: 'completed', completed_at: expect.any(String), updated_at: expect.any(String) },
      filters: [['id', 'card-1'], ['created_by', 'patient-1']],
    });
    expect(updateCalls).toHaveLength(1);
    expect(insertCalls).toEqual([]);
  });

  it('falls back to the owned legacy schedule item and inserts a completion record with injection site', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    updateResults.care_action_cards = [{ data: null, error: null }];
    const { POST } = await import('../../app/api/schedule/complete/route');

    const response = await POST(postRequest({ scheduleItemId: 'item-1', injectionSite: 'lower_right' }));

    expect(response.status).toBe(200);
    expect(updateCalls[1]).toMatchObject({
      table: 'schedule_items',
      values: { status: 'completed', updated_at: expect.any(String) },
      filters: [['id', 'item-1'], ['patient_id', 'patient-1']],
    });
    expect(insertCalls[0]).toMatchObject({
      table: 'completion_records',
      values: {
        schedule_item_id: 'item-1',
        patient_id: 'patient-1',
        completed_at: expect.any(String),
        injection_site: 'lower_right',
      },
    });
  });
});
