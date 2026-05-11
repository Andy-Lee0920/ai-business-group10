import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/schedule/route';
import { createCaptureStore, type CaptureStore } from '../../src/lib/capture-confirm-store';

vi.mock('../../src/lib/capture-confirm-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/capture-confirm-store')>();
  return { ...actual, createCaptureStore: vi.fn() };
});

const mockedCreateStore = vi.mocked(createCaptureStore);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/schedule', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/schedule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires Privacy Gate before creating schedule care data', async () => {
    mockedCreateStore.mockResolvedValue(Response.json({ error: 'Privacy Gate must be accepted' }, { status: 403 }));

    const response = await POST(jsonRequest({ mode: 'add', purpose: 'visit', date: '2026-05-13', time: '09:30' }));

    expect(response.status).toBe(403);
  });

  it('creates exactly one user-confirmed schedule card through the capture confirm flow', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await POST(jsonRequest({
      mode: 'change',
      purpose: 'test',
      date: '2026-05-13',
      time: '09:30',
      memo: '채혈 확인',
    }));
    const payload = (await response.json()) as { createdCardCount: number; summary: string; redirectTo: string };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledOnce();
    expect(createCapture).toHaveBeenCalledWith('일정 변경 확정: 2026-05-13 09:30 검사 — 채혈 확인');
    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith({
      draftId: 'draft-1',
      visitInputId: 'visit-1',
      items: [
        {
          sourceText: '일정 변경 확정: 2026-05-13 09:30 검사 — 채혈 확인',
          assignedTo: 'my_action',
          orderIndex: 0,
          userSelectedCardType: 'clinic_visit',
          scheduledAt: '2026-05-13T09:30:00.000Z',
          careDate: '2026-05-13',
          description: '채혈 확인',
          userMarkedImportant: false,
          partnerVisible: true,
        },
      ],
    });
    expect(payload).toMatchObject({
      createdCardCount: 1,
      redirectTo: '/home',
      summary: '일정 변경 확정: 2026-05-13 09:30 검사 — 채혈 확인',
    });
  });


  it('creates one explicit cancellation summary when the user confirms a schedule cancellation', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-cancel', draftId: 'draft-cancel' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await POST(jsonRequest({
      mode: 'cancel',
      purpose: 'visit',
      date: '2026-05-13',
      time: '09:30',
      memo: '방문 취소 확인',
    }));
    const payload = (await response.json()) as { summary: string; createdCardCount: number };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledWith('일정 취소 확정: 2026-05-13 09:30 방문 — 방문 취소 확인');
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
      items: [expect.objectContaining({
        sourceText: '일정 취소 확정: 2026-05-13 09:30 방문 — 방문 취소 확인',
        userSelectedCardType: 'clinic_visit',
        scheduledAt: '2026-05-13T09:30:00.000Z',
        careDate: '2026-05-13',
        description: '방문 취소 확인',
        userMarkedImportant: false,
        partnerVisible: true,
      })],
    }));
    expect(payload).toMatchObject({ createdCardCount: 1, summary: '일정 취소 확정: 2026-05-13 09:30 방문 — 방문 취소 확인' });
  });

  it('rejects invalid purpose or missing time without writing', async () => {
    const response = await POST(jsonRequest({ mode: 'add', purpose: 'patient', date: '2026-05-13' }));

    expect(response.status).toBe(400);
    expect(mockedCreateStore).not.toHaveBeenCalled();
  });
});
