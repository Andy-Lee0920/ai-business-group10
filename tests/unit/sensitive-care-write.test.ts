import { describe, expect, it, vi } from 'vitest';
import { createSensitiveCareActionCard, type SensitiveCareWriteSupabaseClient } from '../../src/lib/sensitive-care-write';

function createInsertTable(data: unknown) {
  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return chain;
}

describe('sensitive care write seam', () => {
  it('authenticates, checks Privacy Gate, creates visit input, then creates one care action card', async () => {
    const visitTable = createInsertTable({ id: 'visit-1' });
    const cardTable = createInsertTable({ id: 'card-1', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as unknown as SensitiveCareWriteSupabaseClient;

    const result = await createSensitiveCareActionCard(supabase, {
      sourceText: '민감 케어 입력',
      card: {
        assignee_role: 'primary_user',
        card_type: 'record',
        title: '기록',
        status: 'confirmed',
      },
    });

    expect(visitTable.insert).toHaveBeenCalledWith({ couple_id: 'couple-1', raw_text: '민감 케어 입력' });
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      couple_id: 'couple-1',
      created_by: 'user-1',
      source_input_id: 'visit-1',
      source_text: '민감 케어 입력',
      card_type: 'record',
      status: 'confirmed',
    }));
    expect(result).toMatchObject({ cardId: 'card-1', status: 'confirmed', coupleId: 'couple-1', visitInputId: 'visit-1' });
  });

  it('rejects before any sensitive table write when Privacy Gate is missing', async () => {
    const from = vi.fn();
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: null }], error: null }),
      from,
    } as unknown as SensitiveCareWriteSupabaseClient;

    await expect(createSensitiveCareActionCard(supabase, {
      sourceText: '민감 케어 입력',
      card: {
        assignee_role: 'primary_user',
        card_type: 'record',
        title: '기록',
        status: 'confirmed',
      },
    })).rejects.toThrow(/Privacy Gate must be accepted/u);
    expect(from).not.toHaveBeenCalled();
  });
});
