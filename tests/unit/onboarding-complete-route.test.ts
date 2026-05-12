import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as completeOnboarding } from '../../app/api/onboarding/complete/route';
import { createCaptureStore, type CaptureStore } from '../../src/lib/capture-confirm-store';

vi.mock('../../src/lib/capture-confirm-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/capture-confirm-store')>();
  return { ...actual, createCaptureStore: vi.fn() };
});

const mockedCreateStore = vi.mocked(createCaptureStore);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/onboarding/complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires Privacy Gate acceptance before writing first care data', async () => {
    mockedCreateStore.mockResolvedValue(Response.json({ error: 'Privacy Gate must be accepted' }, { status: 403 }));

    const response = await completeOnboarding(jsonRequest({ treatmentContext: 'ivf_cycle', partnerInviteSkipped: true }));

    expect(response.status).toBe(403);
  });

  it('lets a user skip partner invite and create one confirmed injection card for home state', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await completeOnboarding(
      jsonRequest({
        treatmentContext: 'ivf_cycle',
        roleContext: 'primary_with_partner',
        partnerInviteSkipped: true,
        firstItem: { kind: 'injection', text: '오늘 밤 9시 주사 확인' },
      }),
    );
    const payload = (await response.json()) as { redirectTo: string; careDay: string; createdCardCount: number };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledWith('치료 상황: ivf_cycle\n첫 항목: 오늘 밤 9시 주사 확인');
    expect(confirm).toHaveBeenCalledWith({
      draftId: 'draft-1',
      visitInputId: 'visit-1',
      items: [
        {
          sourceText: '오늘 밤 9시 주사 확인',
          assignedTo: 'my_action',
          orderIndex: 0,
          userSelectedCardType: 'injection',
        },
      ],
    });
    expect(payload).toMatchObject({ redirectTo: '/home', careDay: 'injection_day', createdCardCount: 1 });
  });

  it('does not write a partner card or invite when partner invite is optional', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    await completeOnboarding(
      jsonRequest({
        treatmentContext: 'transfer_wait',
        partnerInviteEmail: 'partner@example.com',
        firstItem: { kind: 'medication', text: '프로게스테론 복용 확인' },
      }),
    );

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
      items: [expect.objectContaining({ assignedTo: 'my_action', userSelectedCardType: 'medication' })],
    }));
  });



  it('persists role context for role-based home binding', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 0 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await completeOnboarding(
      jsonRequest({
        treatmentContext: 'ivf_cycle',
        roleContext: 'partner',
        partnerInviteSkipped: false,
        firstItem: null,
      }),
    );
    const payload = (await response.json()) as { roleContext: string; homeIntent: { firstFold: string; primaryCta: string } };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      roleContext: 'partner',
      homeIntent: { firstFold: 'partner_assist_entry', primaryCta: '오늘 도울 일 보기' },
    });
    expect(response.headers.get('set-cookie')).toContain('fevio_onboarding_role_context=partner');
  });

  it('rejects multiple first items so onboarding only creates one starting card', async () => {
    const response = await completeOnboarding(
      jsonRequest({
        treatmentContext: 'ivf_cycle',
        firstItem: [
          { kind: 'schedule', text: '내일 병원' },
          { kind: 'medication', text: '약 복용' },
        ],
      }),
    );

    expect(response.status).toBe(400);
    expect(mockedCreateStore).not.toHaveBeenCalled();
  });
});
