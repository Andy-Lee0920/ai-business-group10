import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as createIvfRecord } from '../../app/api/ivf-record/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(body: unknown, cookie = 'fevio_privacy_accepted=1') {
  return new NextRequest('http://localhost/api/ivf-record', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
}

function createInsertTable(data: unknown) {
  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return chain;
}

describe('/api/ivf-record', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores an IVF stage record as private by default with date context', async () => {
    const visitTable = createInsertTable({ id: 'visit-ivf-1' });
    const cardTable = createInsertTable({ id: 'ivf-card-1', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as never);

    const response = await createIvfRecord(jsonRequest({
      stage: 'culture',
      date: '2026-05-14',
      outcome: '4BC 배아 리포트 확인',
      note: '등급 때문에 마음이 흔들림',
    }));
    const payload = (await response.json()) as { cardId: string; partnerVisible: boolean; title: string };

    expect(response.status).toBe(200);
    expect(visitTable.insert).toHaveBeenCalledWith({ couple_id: 'couple-1', raw_text: 'IVF 기록 · 배아 배양 · 2026-05-14 · 4BC 배아 리포트 확인 · 등급 때문에 마음이 흔들림' });
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      couple_id: 'couple-1',
      created_by: 'user-1',
      source_input_id: 'visit-ivf-1',
      card_type: 'record',
      title: 'IVF 기록 · 배아 배양',
      description: '나를 위한 시술 기록이에요. 공유하지 않아도 충분해요.',
      care_date: '2026-05-14',
      status: 'confirmed',
      confirmation_required: false,
      partner_visible: false,
    }));
    expect(payload).toMatchObject({ cardId: 'ivf-card-1', partnerVisible: false, title: 'IVF 기록 · 배아 배양' });
  });

  it('shares only a partner-safe IVF context when explicitly requested', async () => {
    const visitTable = createInsertTable({ id: 'visit-ivf-2' });
    const cardTable = createInsertTable({ id: 'ivf-card-2', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as never);

    const response = await createIvfRecord(jsonRequest({
      stage: 'opu',
      date: '2026-05-15',
      outcome: '난자 8개 채취',
      note: '마취가 무서웠음',
      shareWithPartner: true,
    }));
    const payload = (await response.json()) as { partnerVisible: boolean; title: string; description: string };

    expect(response.status).toBe(200);
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      card_type: 'record',
      title: '공유된 IVF 기록',
      description: '2026-05-15 난자 채취 단계예요. 결과를 단정하지 말고 이동·회복·다음 확인을 함께 챙겨 주세요.',
      partner_visible: true,
    }));
    expect(payload).toMatchObject({
      partnerVisible: true,
      title: '공유된 IVF 기록',
      description: '2026-05-15 난자 채취 단계예요. 결과를 단정하지 말고 이동·회복·다음 확인을 함께 챙겨 주세요.',
    });
    expect(JSON.stringify(payload)).not.toContain('난자 8개');
    expect(JSON.stringify(payload)).not.toContain('마취가 무서웠음');
  });

  it('requires a stage and valid ISO date before writing sensitive IVF data', async () => {
    const response = await createIvfRecord(jsonRequest({ stage: 'opu', date: '내일' }));

    expect(response.status).toBe(400);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });
});
