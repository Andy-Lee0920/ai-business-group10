import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as createMedication } from '../../app/api/medication/route';
import { POST as completeMedication } from '../../app/api/medication/complete/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';


vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(path: string, body: unknown, cookie = 'fevio_privacy_accepted=1') {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
}

function createSelectChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  return chain;
}

function createCareCardsTable(selectedData: unknown, updatedData: unknown) {
  const selectChain = createSelectChain(selectedData);
  const updateChain = {
    update: vi.fn(() => updateChain),
    eq: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    single: vi.fn().mockResolvedValue({ data: updatedData, error: null }),
  };
  return {
    select: selectChain.select,
    eq: selectChain.eq,
    order: selectChain.order,
    limit: selectChain.limit,
    single: selectChain.single,
    update: updateChain.update,
    updateChain,
  };
}

function createInsertTable(data: unknown) {
  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return chain;
}

describe('/api/medication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when Privacy Gate is not accepted before medication data is written', async () => {
    const visitTable = createInsertTable({ id: 'visit-1' });
    const cardTable = createInsertTable({ id: 'card-1', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: null }], error: null }),
      from,
    } as never);

    const response = await createMedication(jsonRequest('/api/medication', {
      type: 'medication',
      name: '프로게스테론',
      dose: '1정',
      doseConfirmed: true,
      time: '21:00',
    }));

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it('requires a user-entered and explicitly confirmed dose before creating a card', async () => {
    const response = await createMedication(jsonRequest('/api/medication', {
      type: 'injection',
      name: '오비드렐',
      dose: '250mcg',
      doseConfirmed: false,
      time: '22:00',
    }));

    expect(response.status).toBe(400);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
  });

  it('creates exactly one user-confirmed medication/injection card from explicit user type and dose', async () => {
    const visitTable = createInsertTable({ id: 'visit-1' });
    const cardTable = createInsertTable({ id: 'card-1', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as never);

    const response = await createMedication(jsonRequest('/api/medication', {
      type: 'injection',
      name: '오비드렐',
      dose: '250mcg',
      doseConfirmed: true,
      time: '22:00',
      repeat: 'daily',
      important: true,
    }));
    const payload = (await response.json()) as { cardId: string; createdCardCount: number; persisted: boolean };

    expect(response.status).toBe(200);
    expect(visitTable.insert).toHaveBeenCalledWith({ couple_id: 'couple-1', raw_text: '오비드렐 · 250mcg · 22:00 · 매일 · 꼭 챙겨야 해요' });
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      couple_id: 'couple-1',
      created_by: 'user-1',
      source_input_id: 'visit-1',
      card_type: 'injection',
      title: '오비드렐 · 250mcg · 22:00 · 매일 · 꼭 챙겨야 해요',
      scheduled_at: expect.any(String),
      status: 'confirmed',
      user_marked_important: true,
      partner_visible: true,
    }));
    expect(payload).toMatchObject({ cardId: 'card-1', createdCardCount: 1, persisted: true });
  });
});

describe('/api/medication/complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates a user card to completed through the cookie-backed Supabase client', async () => {
    const updateChain = {
      update: vi.fn(() => updateChain),
      eq: vi.fn(() => updateChain),
      select: vi.fn(() => updateChain),
      single: vi.fn().mockResolvedValue({ data: { id: 'card-1', status: 'completed' }, error: null }),
    };
    const from = vi.fn(() => updateChain);
    mockedCreateSupabase.mockResolvedValue({ from } as never);

    const response = await completeMedication(jsonRequest('/api/medication/complete', { cardId: 'card-1' }));
    const payload = (await response.json()) as { cardId: string; status: string };

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith('care_action_cards');
    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed', completed_at: expect.any(String) }));
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'card-1');
    expect(payload).toMatchObject({ cardId: 'card-1', status: 'completed' });
  });


  it('completes a demo medication card without sending the non-UUID id to Supabase', async () => {
    const response = await completeMedication(jsonRequest('/api/medication/complete', { cardId: 'demo-medication-123' }));
    const payload = (await response.json()) as { cardId: string; status: string; persisted: boolean };

    expect(response.status).toBe(200);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
    expect(payload).toMatchObject({ cardId: 'demo-medication-123', status: 'completed', persisted: false });
  });

  it('returns success without a DB write for demo privacy cookie when Supabase public config is missing', async () => {
    mockedCreateSupabase.mockRejectedValue(new Error('Missing Supabase public config'));

    const response = await completeMedication(jsonRequest('/api/medication/complete', { cardId: 'demo-card-1' }));
    const payload = (await response.json()) as { cardId: string; status: string; persisted: boolean };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ cardId: 'demo-card-1', status: 'completed', persisted: false });
  });
});
