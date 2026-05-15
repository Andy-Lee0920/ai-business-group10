import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';
import { createSupabaseServiceRoleClient } from '../../src/lib/server-supabase-admin';

vi.mock('../../src/lib/server-supabase', () => ({ createCookieBackedSupabaseClient: vi.fn() }));
vi.mock('../../src/lib/server-supabase-admin', () => ({ createSupabaseServiceRoleClient: vi.fn() }));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);
const mockedCreateAdminSupabase = vi.mocked(createSupabaseServiceRoleClient);

type DbCall = { table: string; action: 'select' | 'delete' | 'update'; method?: 'eq' | 'in' | 'or'; column?: string; value?: unknown; payload?: unknown };

function postRequest() {
  return new NextRequest('https://project-oznp0.vercel.app/api/account/reset', {
    method: 'POST',
    headers: {
      cookie: [
        'fevio_privacy_gate_v1=accepted',
        'fevio_privacy_accepted=1',
        'fevio_slc_role_v1=patient',
        'fevio_slc_consent_v1=accepted',
        'fevio_first_schedule_skipped_v1=1',
        'fevio_onboarding_first_card=abc',
        'fevio_onboarding_care_cycle_state=abc',
        'fevio_treatment_cards=abc',
      ].join('; '),
    },
  });
}

function makeDeleteBuilder(table: string, calls: DbCall[]) {
  const builder = {
    eq: vi.fn((column: string, value: unknown) => {
      calls.push({ table, action: 'delete', method: 'eq', column, value });
      return Promise.resolve({ error: null });
    }),
    in: vi.fn((column: string, value: unknown[]) => {
      calls.push({ table, action: 'delete', method: 'in', column, value });
      return Promise.resolve({ error: null });
    }),
    or: vi.fn((value: string) => {
      calls.push({ table, action: 'delete', method: 'or', value });
      return Promise.resolve({ error: null });
    }),
  };
  return builder;
}

function makeUpdateBuilder(table: string, calls: DbCall[], payload: unknown) {
  const builder = {
    in: vi.fn((column: string, value: unknown[]) => {
      calls.push({ table, action: 'update', method: 'in', column, value, payload });
      return Promise.resolve({ error: null });
    }),
  };
  return builder;
}

function createAdminMock(coupleIds = ['couple-1']) {
  const calls: DbCall[] = [];
  const list = vi.fn().mockResolvedValue({ data: [{ name: 'photo-a.jpg' }, { name: 'photo-b.jpg' }], error: null });
  const remove = vi.fn().mockResolvedValue({ data: [], error: null });

  return {
    calls,
    storage: { list, remove },
    client: {
      from: vi.fn((table: string) => ({
        select: vi.fn((columns: string) => {
          calls.push({ table, action: 'select', payload: columns });
          return {
            eq: vi.fn((column: string, value: unknown) => {
              calls.push({ table, action: 'select', method: 'eq', column, value });
              return Promise.resolve({ data: coupleIds.map((couple_id) => ({ couple_id })), error: null });
            }),
          };
        }),
        delete: vi.fn(() => makeDeleteBuilder(table, calls)),
        update: vi.fn((payload: unknown) => makeUpdateBuilder(table, calls, payload)),
      })),
      storage: {
        from: vi.fn((bucket: string) => {
          expect(bucket).toBe('clinic-photos');
          return { list, remove };
        }),
      },
    },
  };
}

describe('/api/account/reset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes care/onboarding rows for the signed-in user, clears onboarding cookies, and returns to onboarding', async () => {
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'patient-1' } }, error: null }) },
    } as never);
    const admin = createAdminMock();
    mockedCreateAdminSupabase.mockReturnValue(admin.client as never);

    const { POST } = await import('../../app/api/account/reset/route');
    const response = await POST(postRequest());
    const payload = await response.json() as { ok: boolean; redirectTo: string; deletedTables: string[] };
    const setCookie = response.headers.getSetCookie().join('\n');

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, redirectTo: '/onboarding' });
    expect(payload.deletedTables).toEqual(expect.arrayContaining(['schedule_items', 'user_profiles', 'user_consents', 'care_action_cards']));
    expect(admin.calls).toContainEqual({ table: 'couple_members', action: 'select', payload: 'couple_id' });
    expect(admin.calls).toContainEqual({ table: 'couple_members', action: 'select', method: 'eq', column: 'user_id', value: 'patient-1' });
    expect(admin.calls).toContainEqual({ table: 'partner_links', action: 'delete', method: 'or', value: 'patient_id.eq.patient-1,partner_id.eq.patient-1' });
    expect(admin.calls).toContainEqual({ table: 'schedule_items', action: 'delete', method: 'eq', column: 'patient_id', value: 'patient-1' });
    expect(admin.calls).toContainEqual({ table: 'care_action_cards', action: 'delete', method: 'in', column: 'couple_id', value: ['couple-1'] });
    expect(admin.calls).toContainEqual({
      table: 'couple_states',
      action: 'update',
      method: 'in',
      column: 'couple_id',
      value: ['couple-1'],
      payload: expect.objectContaining({ first_capture_completed_at: null, waiting_mode_enabled: false }),
    });
    expect(admin.storage.list).toHaveBeenCalledWith('patient-1');
    expect(admin.storage.remove).toHaveBeenCalledWith(['patient-1/photo-a.jpg', 'patient-1/photo-b.jpg']);
    expect(setCookie).toContain('fevio_slc_role_v1=;');
    expect(setCookie).toContain('fevio_slc_consent_v1=;');
    expect(setCookie).toContain('fevio_first_schedule_skipped_v1=;');
    expect(setCookie).toContain('fevio_onboarding_first_card=;');
    expect(setCookie).not.toContain('fevio_privacy_gate_v1=;');
    expect(setCookie).not.toContain('fevio_privacy_accepted=;');
  });

  it('rejects reset when there is no signed-in user', async () => {
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);

    const { POST } = await import('../../app/api/account/reset/route');
    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(mockedCreateAdminSupabase).not.toHaveBeenCalled();
  });
});
