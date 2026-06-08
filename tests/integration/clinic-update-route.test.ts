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
    rpc: async () => ({ data: { couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-10T00:00:00.000Z' }, error: null }),
    from: (table: string) => ({
      insert: (values: unknown) => {
        insertCalls.push({ table, values });
        const rows = Array.isArray(values) ? values : [values];
        const data = rows.map((row, index) => ({ id: `${table}-${index + 1}`, ...row }));
        return {
          error: null,
          select: () => ({
            ...(table === 'visit_inputs' || table === 'action_split_drafts'
              ? { single: async () => ({ data: data[0] ?? null, error: null }) }
              : {}),
            then: (resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) => resolve({ data, error: null }),
          }),
        };
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

  it('does not write structured care cards before explicit user confirmation', async () => {
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
          scheduledAt: '2026-05-16T09:00:00.000+09:00',
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
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(409);
    expect(payload.error).toBe('structured_confirmation_required');
    expect(insertCalls).toHaveLength(0);
  });

  it('confirms structured clinic input into canonical care cards with provenance and no split candidates', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/clinic-update/route');

    const response = await POST(postRequest({
      sameMedication: false,
      addedMedicationIds: ['gonal-f'],
      medicationDays: 2,
      nextVisitAt: '2026-05-16T00:00:00.000Z',
      triggerPlan: 'tomorrow',
      memo: '다음 방문 전까지 유지',
      confirmStructured: true,
      newScheduleItems: [
        {
          medicationId: null,
          type: 'clinic',
          title: '다음 병원 방문',
          dose: null,
          unit: null,
          scheduledAt: '2026-05-16T09:00:00.000+09:00',
        },
        {
          medicationId: 'gonal-f',
          type: 'medication',
          title: '고날에프',
          dose: null,
          unit: 'IU',
          scheduledAt: '2026-05-16T19:00:00.000+09:00',
        },
      ],
    }));
    const payload = await response.json() as { confirmed: boolean; visitInputId: string; scheduleItems: Array<{ title: string }> };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      confirmed: true,
      visitInputId: 'visit_inputs-1',
      scheduleItems: [
        expect.objectContaining({ title: '다음 병원 방문' }),
        expect.objectContaining({ title: '고날에프' }),
      ],
    });
    expect(insertCalls.map((call) => call.table)).toEqual(['visit_inputs', 'action_split_drafts', 'care_action_cards']);
    expect(insertCalls[0]).toMatchObject({ table: 'visit_inputs' });
    expect(String((insertCalls[0].values as Record<string, unknown>).raw_text)).toContain('clinic_update_structured_confirm');
    expect(insertCalls[1]).toMatchObject({
      table: 'action_split_drafts',
      values: { couple_id: 'couple-1', visit_input_id: 'visit_inputs-1', status: 'draft' },
    });
    expect(insertCalls[2]).toMatchObject({ table: 'care_action_cards' });
    expect(insertCalls[2].values).toEqual([
      expect.objectContaining({
        couple_id: 'couple-1',
        created_by: 'patient-1',
        source_input_id: 'visit_inputs-1',
        split_candidate_id: null,
        assignee_role: 'primary_user',
        card_type: 'clinic_visit',
        title: '다음 병원 방문',
        scheduled_at: '2026-05-16T00:00:00.000Z',
        status: 'confirmed',
        confirmation_required: false,
        partner_visible: false,
      }),
      expect.objectContaining({
        couple_id: 'couple-1',
        created_by: 'patient-1',
        source_input_id: 'visit_inputs-1',
        split_candidate_id: null,
        assignee_role: 'primary_user',
        card_type: 'medication',
        title: '고날에프',
        description: 'IU',
        status: 'confirmed',
        confirmation_required: false,
        partner_visible: false,
      }),
    ]);
    expect(insertCalls.some((call) => call.table === 'split_candidates')).toBe(false);
    expect(insertCalls.some((call) => call.table === 'schedule_items')).toBe(false);
    expect(insertCalls.some((call) => call.table === 'clinic_updates')).toBe(false);
  });

  it('lets structured confirmation opt in to partner-visible policy fields without partner free text', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/clinic-update/route');

    const response = await POST(postRequest({
      sameMedication: null,
      addedMedicationIds: [],
      medicationDays: 1,
      nextVisitAt: null,
      triggerPlan: '',
      memo: '',
      confirmStructured: true,
      structuredPartnerVisible: true,
      newScheduleItems: [
        {
          medicationId: null,
          type: 'injection',
          title: '오비드렐',
          dose: '250',
          unit: 'mcg',
          scheduledAt: '2026-05-16T22:00:00.000+09:00',
        },
      ],
    }));

    expect(response.status).toBe(200);
    expect(insertCalls.map((call) => call.table)).toEqual(['visit_inputs', 'action_split_drafts', 'care_action_cards']);
    expect(insertCalls[2].values).toEqual([
      expect.objectContaining({
        assignee_role: 'both',
        partner_visible: true,
        card_type: 'injection',
        title: '오비드렐',
        description: '250 mcg',
      }),
    ]);
    expect(JSON.stringify(insertCalls[2].values)).not.toContain(['partner', 'prompt'].join('_'));
  });

  it('routes ambiguous free memo to visit input, split draft, and split candidates without creating confirmed cards', async () => {
    userResponses.push({ data: { user: { id: 'patient-1' } }, error: null });
    const { POST } = await import('../../app/api/clinic-update/route');

    const rawMemo = '오늘 밤 오비드렐 주사\n내일 오전 병원 방문';
    const response = await POST(postRequest({
      sameMedication: null,
      addedMedicationIds: [],
      medicationDays: null,
      nextVisitAt: null,
      triggerPlan: '',
      memo: rawMemo,
      newScheduleItems: [],
    }));
    const payload = await response.json() as {
      reviewRequired: boolean;
      visitInputId: string;
      draftId: string;
      candidates: Array<{ id: string; title: string; type: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      reviewRequired: true,
      visitInputId: 'visit_inputs-1',
      draftId: 'action_split_drafts-1',
      candidates: [
        expect.objectContaining({ id: 'split_candidates-1', title: '오늘 밤 오비드렐 주사', type: 'injection' }),
        expect.objectContaining({ id: 'split_candidates-2', title: '내일 오전 병원 방문', type: 'clinic' }),
      ],
    });
    expect(insertCalls.map((call) => call.table)).toEqual(['visit_inputs', 'action_split_drafts', 'split_candidates']);
    expect(insertCalls[0]).toEqual({
      table: 'visit_inputs',
      values: { couple_id: 'couple-1', raw_text: rawMemo },
    });
    expect(insertCalls[2].values).toEqual([
      expect.objectContaining({
        couple_id: 'couple-1',
        draft_id: 'action_split_drafts-1',
        visit_input_id: 'visit_inputs-1',
        source_text: '오늘 밤 오비드렐 주사',
        source_offset_start: 0,
        source_offset_end: 12,
        assigned_to: 'my_action',
        suggested_card_type: 'injection',
        confidence: 'needs_confirmation',
        order_index: 0,
      }),
      expect.objectContaining({
        couple_id: 'couple-1',
        draft_id: 'action_split_drafts-1',
        visit_input_id: 'visit_inputs-1',
        source_text: '내일 오전 병원 방문',
        assigned_to: 'my_action',
        suggested_card_type: 'clinic_visit',
        confidence: 'needs_confirmation',
        order_index: 1,
      }),
    ]);
    expect(insertCalls.some((call) => call.table === 'clinic_updates')).toBe(false);
    expect(insertCalls.some((call) => call.table === 'schedule_items')).toBe(false);
    expect(insertCalls.some((call) => call.table === 'care_action_cards')).toBe(false);
  });
});
