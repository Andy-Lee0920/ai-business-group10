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
    expect(createCapture).toHaveBeenCalledWith('치료 상황: ivf_cycle\n역할 설정: primary_with_partner\n공유 범위: basic\n첫 항목: 오늘 밤 9시 주사 확인');
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

  it('stores concise baseline profile context without turning it into action cards', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 0 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    await completeOnboarding(
      jsonRequest({
        treatmentContext: 'ivf_cycle',
        treatmentExperience: 'first_ivf',
        baselineProfile: { age: '36', heightCm: '164', weightKg: '58', medicalNotes: '갑상선 약 복용 중' },
        partnerInviteSkipped: true,
        firstItem: null,
      }),
    );

    expect(createCapture).toHaveBeenCalledWith([
      '시술 경험: first_ivf',
      '나이: 36',
      '신장: 164cm',
      '체중: 58kg',
      '주의사항: 갑상선 약 복용 중',
      '치료 상황: ivf_cycle',
      '역할 설정: primary_solo',
      '공유 범위: basic',
    ].join('\n'));
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ items: [] }));
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




  it('accepts the 4-step onboarding payload without baseline profile and stores stage sharing cookies', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await completeOnboarding(
      jsonRequest({
        treatmentExperience: 'first_ivf',
        firstCareItem: { selectedIntent: 'medication', rawText: '밤에 주사', attachments: [], medicalNotes: '' },
        effectiveStage: 'ovarian_stimulation',
        roleContext: 'primary_with_partner',
        partnerInvite: { intent: 'prepare_invite' },
      }),
    );
    const payload = await response.json() as { roleContext: string; sharingLevel: string; effectiveStage: string; partnerInvite: string };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ roleContext: 'primary_with_partner', sharingLevel: 'care', effectiveStage: 'ovarian_stimulation', partnerInvite: 'prepare_invite' });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
      items: [expect.objectContaining({ sourceText: '밤에 주사', userSelectedCardType: 'injection' })],
    }));
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('fevio_onboarding_role_context=primary_with_partner');
    expect(setCookie).toContain('fevio_onboarding_sharing_level=care');
    expect(setCookie).toContain('fevio_onboarding_partner_invite=prepare_invite');
  });

  it('keeps pregnancy test partner sharing basic by default', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await completeOnboarding(
      jsonRequest({
        firstCareItem: { selectedIntent: 'pregnancy_test', rawText: '피검 결과는 전화로 안내', attachments: [] },
        effectiveStage: 'pregnancy_test',
        roleContext: 'primary_with_partner',
        partnerInvite: { intent: 'prepare_invite' },
      }),
    );
    const payload = await response.json() as { sharingLevel: string };

    expect(response.status).toBe(200);
    expect(payload.sharingLevel).toBe('basic');
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
