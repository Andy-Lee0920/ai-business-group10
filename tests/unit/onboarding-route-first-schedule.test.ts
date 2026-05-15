import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/onboarding/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/server-supabase', () => ({ createCookieBackedSupabaseClient: vi.fn() }));
vi.mock('../../src/config', () => ({ isPresentationMode: () => false }));
vi.mock('../../src/lib/seed-helpers', () => ({ getSeedItems: vi.fn(() => []) }));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createSupabaseMock() {
  const calls: Array<{ table: string; action: string; payload: unknown }> = [];
  const scheduleSingle = vi.fn().mockResolvedValue({ data: { id: 'schedule-1' }, error: null });
  const scheduleSelect = vi.fn(() => ({ single: scheduleSingle }));
  const scheduleInsert = vi.fn((payload: unknown) => {
    calls.push({ table: 'schedule_items', action: 'insert', payload });
    return { select: scheduleSelect };
  });
  const profileUpsert = vi.fn((payload: unknown) => {
    calls.push({ table: 'user_profiles', action: 'upsert', payload });
    return Promise.resolve({ error: null });
  });
  const consentUpsert = vi.fn((payload: unknown) => {
    calls.push({ table: 'user_consents', action: 'upsert', payload });
    return Promise.resolve({ error: null });
  });
  const from = vi.fn((table: string) => {
    if (table === 'schedule_items') return { insert: scheduleInsert };
    if (table === 'user_profiles') return { upsert: profileUpsert };
    if (table === 'user_consents') return { upsert: consentUpsert };
    return { select: vi.fn() };
  });

  return {
    calls,
    from,
    client: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'patient-1', user_metadata: { full_name: 'Lee' } } }, error: null }) },
      from,
    },
  };
}

const requiredConsentChecks = {
  privacy_boundary: true,
  sensitive_data: true,
  clinical_boundary: true,
  input_assist_boundary: true,
};

describe('/api/onboarding first schedule contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects sensitive onboarding writes until all four consent checks are explicit', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockResolvedValue(supabase.client as never);

    const response = await POST(jsonRequest({ role: 'patient', consentChecks: { privacy_boundary: true } }));
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain('동의');
    expect(supabase.from).not.toHaveBeenCalledWith('schedule_items');
  });

  it('stores the confirmed first schedule with onboarding_interview source after consent', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockResolvedValue(supabase.client as never);

    const response = await POST(jsonRequest({
      role: 'patient',
      consentChecks: requiredConsentChecks,
      firstSchedule: {
        type: 'injection',
        title: '고날에프 주사',
        scheduledAt: '2026-05-15T12:00:00.000Z',
        dose: '150',
        unit: 'IU',
        medicationId: 'gonal-f',
        optionalMemo: '병원 안내 그대로 확인',
        inputAssist: { source: 'aliases', matchedMedicationId: 'gonal-f', matchedMedicationLabel: '고날에프', requiresUserConfirmation: true },
      },
    }));
    const payload = await response.json() as { ok: boolean; redirectTo: string; firstScheduleItem: { id: string } };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, redirectTo: '/home', firstScheduleItem: { id: 'schedule-1' } });
    expect(supabase.calls).toContainEqual(expect.objectContaining({ table: 'user_consents', action: 'upsert' }));
    expect(supabase.calls).toContainEqual({
      table: 'schedule_items',
      action: 'insert',
      payload: expect.objectContaining({
        patient_id: 'patient-1',
        type: 'injection',
        title: '고날에프 주사',
        source: 'onboarding_interview',
        medication_id: 'gonal-f',
      }),
    });
  });

  it('lets patient choose later without auto-seeding or AI-saving a schedule', async () => {
    const supabase = createSupabaseMock();
    mockedCreateSupabase.mockResolvedValue(supabase.client as never);

    const response = await POST(jsonRequest({ role: 'patient', consentChecks: requiredConsentChecks, skipFirstSchedule: true }));

    expect(response.status).toBe(200);
    expect(supabase.from).not.toHaveBeenCalledWith('schedule_items');
  });
});
