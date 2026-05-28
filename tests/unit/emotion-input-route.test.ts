import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as createEmotion } from '../../app/api/emotion/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(body: unknown, cookie = 'fevio_privacy_accepted=1') {
  return new NextRequest('http://localhost/api/emotion', {
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

describe('/api/emotion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps emotion records private by default and stores them as record cards', async () => {
    const visitTable = createInsertTable({ id: 'visit-emotion-1' });
    const cardTable = createInsertTable({ id: 'emotion-card-1', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as never);

    const response = await createEmotion(jsonRequest({
      mood: 'overwhelmed',
      intensity: 4,
      note: '나만 고생하는 것 같아서 서운해',
    }));
    const payload = (await response.json()) as { cardId: string; partnerVisible: boolean; title: string; description: string };

    expect(response.status).toBe(200);
    expect(visitTable.insert).toHaveBeenCalledWith({ couple_id: 'couple-1', raw_text: '감정 기록 · 버거워요 · 강도 4/5 · 나만 고생하는 것 같아서 서운해' });
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      couple_id: 'couple-1',
      created_by: 'user-1',
      source_input_id: 'visit-emotion-1',
      card_type: 'record',
      title: '감정 기록 · 버거워요',
      description: '나를 위한 비공개 감정 기록이에요. 공유하지 않아도 충분해요.',
      status: 'confirmed',
      confirmation_required: false,
      partner_visible: false,
    }));
    expect(payload).toMatchObject({ cardId: 'emotion-card-1', partnerVisible: false, title: '감정 기록 · 버거워요' });
  });

  it('shares only a partner-safe emotional signal when explicitly requested', async () => {
    const visitTable = createInsertTable({ id: 'visit-emotion-2' });
    const cardTable = createInsertTable({ id: 'emotion-card-2', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as never);

    const response = await createEmotion(jsonRequest({
      mood: 'anxious',
      intensity: 5,
      note: '실패할까봐 너무 무서워',
      shareWithPartner: true,
    }));
    const payload = (await response.json()) as { partnerVisible: boolean; title: string; description: string };

    expect(response.status).toBe(200);
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      card_type: 'record',
      title: '공유된 감정 신호',
      description: '오늘은 마음이 많이 긴장된 날이에요. 해결책보다 조용한 도움을 먼저 건네 주세요.',
      partner_visible: true,
    }));
    expect(payload).toMatchObject({
      partnerVisible: true,
      title: '공유된 감정 신호',
      description: '오늘은 마음이 많이 긴장된 날이에요. 해결책보다 조용한 도움을 먼저 건네 주세요.',
    });
    expect(JSON.stringify(payload)).not.toContain('실패할까봐');
  });

  it('requires an explicit mood before writing sensitive emotion data', async () => {
    const response = await createEmotion(jsonRequest({ note: '오늘 힘듦' }));

    expect(response.status).toBe(400);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });
});
