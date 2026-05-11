import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as createMedication } from '../../app/api/medication/route';
import { POST as completeMedication } from '../../app/api/medication/complete/route';
import { createCaptureStore, type CaptureStore } from '../../src/lib/capture-confirm-store';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/capture-confirm-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/capture-confirm-store')>();
  return { ...actual, createCaptureStore: vi.fn() };
});

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateStore = vi.mocked(createCaptureStore);
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

describe('/api/medication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when Privacy Gate is not accepted before medication data is written', async () => {
    mockedCreateStore.mockResolvedValue(Response.json({ error: 'Privacy Gate must be accepted' }, { status: 403 }));

    const response = await createMedication(jsonRequest('/api/medication', {
      type: 'medication',
      name: '프로게스테론',
      dose: '1정',
      doseConfirmed: true,
      time: '21:00',
    }));

    expect(response.status).toBe(403);
    expect(mockedCreateSupabase).not.toHaveBeenCalled();
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
    expect(mockedCreateStore).not.toHaveBeenCalled();
  });

  it('creates exactly one user-confirmed medication/injection card from explicit user type and dose', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);
    const cardsTable = createCareCardsTable({ id: 'card-1', status: 'confirmed' }, { id: 'card-1', status: 'confirmed' });
    mockedCreateSupabase.mockResolvedValue({ from: vi.fn(() => cardsTable) } as never);

    const response = await createMedication(jsonRequest('/api/medication', {
      type: 'injection',
      name: '오비드렐',
      dose: '250mcg',
      doseConfirmed: true,
      time: '22:00',
      repeat: 'daily',
      important: true,
    }));
    const payload = (await response.json()) as { cardId: string; createdCardCount: number };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledWith('오비드렐 · 250mcg · 22:00 · 매일 · 꼭 챙겨야 해요');
    expect(confirm).toHaveBeenCalledWith({
      draftId: 'draft-1',
      visitInputId: 'visit-1',
      items: [{
        sourceText: '오비드렐 · 250mcg · 22:00 · 매일 · 꼭 챙겨야 해요',
        assignedTo: 'my_action',
        orderIndex: 0,
        userSelectedCardType: 'injection',
      }],
    });
    expect(payload).toMatchObject({ cardId: 'card-1', createdCardCount: 1 });
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

  it('returns success without a DB write for demo privacy cookie when Supabase public config is missing', async () => {
    mockedCreateSupabase.mockRejectedValue(new Error('Missing Supabase public config'));

    const response = await completeMedication(jsonRequest('/api/medication/complete', { cardId: 'demo-card-1' }));
    const payload = (await response.json()) as { cardId: string; status: string; persisted: boolean };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ cardId: 'demo-card-1', status: 'completed', persisted: false });
  });
});
