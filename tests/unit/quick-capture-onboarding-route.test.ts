import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as quickCapture } from '../../app/api/onboarding/quick-capture/route';
import { createCaptureStore, type CaptureStore } from '../../src/lib/capture-confirm-store';

vi.mock('../../src/lib/capture-confirm-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/capture-confirm-store')>();
  return { ...actual, createCaptureStore: vi.fn() };
});

const mockedCreateStore = vi.mocked(createCaptureStore);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/quick-capture', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/onboarding/quick-capture', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a today medication card from minimal time and next visit date without requiring prescription typing', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 2 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await quickCapture(jsonRequest({ firstMedicationTime: '21:00', nextVisitDate: '2026-05-13' }));
    const payload = (await response.json()) as { redirectTo: string; createdCardCount: number; quickCaptureDone: boolean; fullSetupHref: string; reminder: { kind: string } };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledWith('Quick Capture\n첫 약/주사 시간: 21:00\n다음 병원 방문: 2026-05-13');
    expect(confirm).toHaveBeenCalledWith({
      draftId: 'draft-1',
      visitInputId: 'visit-1',
      items: [
        expect.objectContaining({
          sourceText: '오늘 21:00 약/주사 확인',
          assignedTo: 'my_action',
          userSelectedCardType: 'medication',
          scheduledAt: expect.any(String),
        }),
        expect.objectContaining({
          sourceText: '2026-05-13 병원 방문 예정',
          assignedTo: 'my_action',
          userSelectedCardType: 'clinic_visit',
          careDate: '2026-05-13',
        }),
      ],
    });
    expect(payload).toMatchObject({ redirectTo: '/home', createdCardCount: 2, quickCaptureDone: true, fullSetupHref: '/onboard/full-setup', reminder: { kind: 'tomorrow_setup' } });
    expect(response.headers.get('set-cookie')).toContain('fevio_onboarding_quick_capture_done=1');
  });

  it('continues when prescription photo upload failed and marks the photo as skipped', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 2 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await quickCapture(jsonRequest({ firstMedicationTime: '08:30', nextVisitDate: '2026-05-14', prescriptionPhotoUploadFailed: true }));
    const payload = (await response.json()) as { prescriptionPhoto: string };

    expect(response.status).toBe(200);
    expect(payload.prescriptionPhoto).toBe('skipped');
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('rejects missing minimal time or visit date', async () => {
    const response = await quickCapture(jsonRequest({ firstMedicationTime: '21:00' }));

    expect(response.status).toBe(400);
    expect(mockedCreateStore).not.toHaveBeenCalled();
  });
});
