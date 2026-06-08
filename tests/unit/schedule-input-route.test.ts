import { NextResponse } from 'next/server';
import { describe, expect, it, beforeEach, vi } from 'vitest';

type QueryResult = { data: unknown[] | null; error: { message: string; code?: string } | null };
type QueryCall = { table: string; action: string; column?: string; value?: unknown; values?: unknown[]; columns?: string };

const userResponses = vi.hoisted((): Array<{ data: { user: { id: string } | null } }> => []);
const queryResults = vi.hoisted((): Record<string, QueryResult[]> => ({}));
const queryCalls = vi.hoisted((): QueryCall[] => []);

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => userResponses.shift() ?? { data: { user: null } }) },
    from: (table: string) => {
      const builder = {
        select(columns: string) {
          queryCalls.push({ table, action: 'select', columns });
          return builder;
        },
        eq(column: string, value: unknown) {
          queryCalls.push({ table, action: 'eq', column, value });
          return builder;
        },
        in(column: string, values: unknown[]) {
          queryCalls.push({ table, action: 'in', column, values });
          return builder;
        },
        gte(column: string, value: unknown) {
          queryCalls.push({ table, action: 'gte', column, value });
          return builder;
        },
        lte(column: string, value: unknown) {
          queryCalls.push({ table, action: 'lte', column, value });
          return builder;
        },
        order(column: string, value: unknown) {
          queryCalls.push({ table, action: 'order', column, value });
          return Promise.resolve(queryResults[table]?.shift() ?? { data: [], error: null });
        },
      };
      return builder;
    },
  })),
}));

import { GET } from '../../app/api/schedule/route';

function todayAt(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

describe('/api/schedule SLC read route', () => {
  beforeEach(() => {
    userResponses.length = 0;
    queryCalls.length = 0;
    for (const key of Object.keys(queryResults)) delete queryResults[key];
  });

  it('does not expose legacy schedule POST from the deprecated care-OS flow', async () => {
    const module = await import('../../app/api/schedule/route');
    expect('POST' in module).toBe(false);
  });

  it('requires authentication before reading schedule items', async () => {
    const response = await GET();
    const payload = await response.json() as { error: string };
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    expect(payload.error).toBe('unauthorized');
  });

  it('prefers canonical care_action_cards and does not shadow them with legacy schedule_items', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } } });
    queryResults.care_action_cards = [{
      data: [{
        id: 'card-1',
        couple_id: 'couple-1',
        created_by: 'patient-1',
        assignee_role: 'primary_user',
        card_type: 'injection',
        title: '오비드렐 주사',
        description: null,
        source_text: '오비드렐 주사',
        scheduled_at: todayAt(12),
        care_date: null,
        status: 'confirmed',
        confirmation_required: false,
        user_marked_important: true,
        partner_visible: false,
        revision: 1,
        created_at: todayAt(8),
      }],
      error: null,
    }];

    const response = await GET();
    const payload = await response.json() as { source: string; items: Array<{ id: string; type: string; title: string }> };

    expect(response.status).toBe(200);
    expect(payload.source).toBe('care_action_cards');
    expect(payload.items).toEqual([expect.objectContaining({ id: 'card-1', type: 'injection', title: '오비드렐 주사' })]);
    expect(queryCalls.map((call) => call.table)).not.toContain('schedule_items');
  });


  it('preserves legacy schedule usability when canonical reads are unavailable', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } } });
    queryResults.care_action_cards = [{ data: null, error: { message: 'temporary canonical read unavailable' } }];
    queryResults.schedule_items = [{
      data: [{
        id: 'legacy-1',
        patient_id: 'patient-1',
        medication_id: null,
        type: 'medication',
        title: '듀파스톤 복용',
        dose: null,
        unit: null,
        scheduled_at: todayAt(9),
        status: 'upcoming',
        source: 'manual',
        created_at: todayAt(8),
      }],
      error: null,
    }];

    const response = await GET();
    const payload = await response.json() as { source: string; items: Array<{ id: string; title: string }> };

    expect(response.status).toBe(200);
    expect(payload.source).toBe('legacy_schedule_items');
    expect(payload.items).toEqual([expect.objectContaining({ id: 'legacy-1', title: '듀파스톤 복용' })]);
  });

  it('falls back to legacy schedule_items only when no canonical care cards are available', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } } });
    queryResults.care_action_cards = [{ data: [], error: null }];
    queryResults.schedule_items = [{
      data: [{
        id: 'legacy-1',
        patient_id: 'patient-1',
        medication_id: null,
        type: 'clinic',
        title: '병원 방문',
        dose: null,
        unit: null,
        scheduled_at: todayAt(10),
        status: 'upcoming',
        source: 'manual',
        created_at: todayAt(9),
      }],
      error: null,
    }];

    const response = await GET();
    const payload = await response.json() as { source: string; items: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.source).toBe('legacy_schedule_items');
    expect(payload.items).toEqual([expect.objectContaining({ id: 'legacy-1' })]);
    expect(queryCalls.findIndex((call) => call.table === 'care_action_cards')).toBeLessThan(queryCalls.findIndex((call) => call.table === 'schedule_items'));
  });
});
