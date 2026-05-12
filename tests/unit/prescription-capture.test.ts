import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPrescriptionMedicationCard } from '../../src/domain/prescription-capture';
import { POST as prescriptionCapture } from '../../app/api/prescription/capture/route';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';

vi.mock('../../src/lib/server-supabase', () => ({
  createCookieBackedSupabaseClient: vi.fn(),
}));

const mockedCreateSupabase = vi.mocked(createCookieBackedSupabaseClient);

function jsonRequest(body: unknown, cookie = 'fevio_privacy_accepted=1') {
  return new NextRequest('http://localhost/api/prescription/capture', {
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

describe('Prescription Capture', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds a medication card from a prescription photo only after user-confirmed dose fields', () => {
    const card = buildPrescriptionMedicationCard({
      photoUrl: 'https://storage.example/prescriptions/a.jpg',
      type: 'injection',
      name: '프로게스테론',
      dose: '1mL',
      doseConfirmed: true,
      time: '21:30',
      administeredBy: 'partner',
    });

    expect(card).toMatchObject({
      card_type: 'injection',
      title: '주사 · 프로게스테론 · 1mL · 21:30',
      prescription_photo_url: 'https://storage.example/prescriptions/a.jpg',
      prescription_capture_status: 'photo_attached',
      administered_by: 'partner',
      confirmation_required: false,
    });
    expect(JSON.stringify(card)).not.toMatch(/AI|추정|자동 판독/u);
  });

  it('rejects a photo-only capture without explicit user dose confirmation', () => {
    expect(() => buildPrescriptionMedicationCard({
      photoUrl: 'https://storage.example/prescriptions/a.jpg',
      type: 'medication',
      name: '프로기노바',
      dose: '1정',
      doseConfirmed: false,
      time: '08:00',
      administeredBy: 'self',
    })).toThrow(/직접 확인/u);
  });

  it('persists photo url and administration owner through the capture route', async () => {
    const visitTable = createInsertTable({ id: 'visit-prescription' });
    const cardTable = createInsertTable({ id: 'card-prescription', status: 'confirmed' });
    const from = vi.fn((table: string) => (table === 'visit_inputs' ? visitTable : cardTable));
    mockedCreateSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: [{ couple_id: 'couple-1', privacy_gate_accepted_at: '2026-05-11T00:00:00.000Z' }], error: null }),
      from,
    } as never);

    const response = await prescriptionCapture(jsonRequest({
      photoUrl: 'https://storage.example/prescriptions/a.jpg',
      type: 'injection',
      name: '프로게스테론',
      dose: '1mL',
      doseConfirmed: true,
      time: '21:30',
      administeredBy: 'partner',
    }));
    const payload = (await response.json()) as { cardId: string; persisted: boolean };

    expect(response.status).toBe(200);
    expect(cardTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      card_type: 'injection',
      prescription_photo_url: 'https://storage.example/prescriptions/a.jpg',
      prescription_capture_status: 'photo_attached',
      administered_by: 'partner',
      partner_visible: true,
    }));
    expect(payload).toMatchObject({ cardId: 'card-prescription', persisted: true });
  });

  it('adds RLS-backed schema fields and keeps partner confirmation in injection logs', () => {
    const migration = readFileSync('supabase/migrations/202605120004_prescription_capture.sql', 'utf8');
    const matrix = readFileSync('docs/03-engineering/schema-rls-matrix.md', 'utf8');

    expect(migration).toContain('prescription_photo_url');
    expect(migration).toContain('prescription_capture_status');
    expect(migration).toContain('administered_by');
    expect(migration).toContain('injection_logs');
    expect(migration).not.toContain('grant select, insert, update on public.care_action_cards to anon');
    expect(matrix).toContain('prescription_capture_status');
  });
});
