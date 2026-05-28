import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as capturePost } from '../../app/api/capture/route';
import { POST as confirmPost } from '../../app/api/confirm/route';
import { inferCardType } from '../../src/domain/line-split';
import { createCaptureStore, type CaptureStore } from '../../src/lib/capture-confirm-store';

vi.mock('../../src/lib/capture-confirm-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/capture-confirm-store')>();
  return { ...actual, createCaptureStore: vi.fn() };
});

const mockedCreateStore = vi.mocked(createCaptureStore);

function jsonRequest(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/capture', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when Privacy Gate is not accepted', async () => {
    mockedCreateStore.mockResolvedValue(Response.json({ error: 'Privacy Gate must be accepted' }, { status: 403 }));

    const response = await capturePost(jsonRequest('/api/capture', { rawText: '주사' }));

    expect(response.status).toBe(403);
  });

  it('returns 400 for empty capture text', async () => {
    const response = await capturePost(jsonRequest('/api/capture', { rawText: '   ' }));

    expect(response.status).toBe(400);
    expect(mockedCreateStore).not.toHaveBeenCalled();
  });

  it('creates visit input plus split draft and returns manual candidates', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm: vi.fn() } satisfies CaptureStore);

    const rawText = '1. 주사\n2. 병원 방문';
    const response = await capturePost(jsonRequest('/api/capture', { rawText }));
    const payload = (await response.json()) as {
      visitInputId: string;
      draftId: string;
      candidates: Array<{ sourceText: string; sourceOffsetStart: number; sourceOffsetEnd: number }>;
    };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledWith(rawText);
    expect(payload).toMatchObject({ visitInputId: 'visit-1', draftId: 'draft-1' });
    expect(payload.candidates.map((candidate) => candidate.sourceText)).toEqual(['주사', '병원 방문']);
    for (const candidate of payload.candidates) {
      expect(rawText.slice(candidate.sourceOffsetStart, candidate.sourceOffsetEnd)).toBe(candidate.sourceText);
    }
  });
});

describe('/api/confirm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates confirmed care action cards from classified candidates', async () => {
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 2 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture: vi.fn(), confirm } satisfies CaptureStore);

    const response = await confirmPost(
      jsonRequest('/api/confirm', {
        draftId: 'draft-1',
        visitInputId: 'visit-1',
        items: [
          { sourceText: '오비드렐 주사 밤 10시', sourceOffsetStart: 0, sourceOffsetEnd: 13, assignedTo: 'my_action' },
          { sourceText: '남편이 준비 도와주기', assignedTo: 'partner_action' },
          { sourceText: '중복 메모', assignedTo: 'excluded' },
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect(confirm).toHaveBeenCalledWith({
      draftId: 'draft-1',
      visitInputId: 'visit-1',
      items: [
        expect.objectContaining({ sourceText: '오비드렐 주사 밤 10시', sourceOffsetStart: 0, sourceOffsetEnd: 13, assignedTo: 'my_action', orderIndex: 0 }),
        expect.objectContaining({ sourceText: '남편이 준비 도와주기', assignedTo: 'partner_action', orderIndex: 1 }),
        expect.objectContaining({ sourceText: '중복 메모', assignedTo: 'excluded', orderIndex: 2 }),
      ],
    });
  });



  it('passes protocol draft metadata through confirmation only after user review', async () => {
    const confirm = vi.fn().mockResolvedValue({ createdCardCount: 1 });
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture: vi.fn(), confirm } satisfies CaptureStore);

    const response = await confirmPost(
      jsonRequest('/api/confirm', {
        draftId: 'draft-protocol',
        visitInputId: 'visit-protocol',
        items: [
          {
            sourceText: '오늘 밤 10시 오비드렐 주사',
            assignedTo: 'my_action',
            suggestedCardType: 'injection',
            scheduledAt: '2026-05-11T22:00:00.000Z',
            careDate: '2026-05-11',
            description: '병원 안내에서 만든 확정 전 초안',
            userMarkedImportant: true,
            partnerVisible: true,
          },
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect(confirm).toHaveBeenCalledWith({
      draftId: 'draft-protocol',
      visitInputId: 'visit-protocol',
      items: [
        expect.objectContaining({
          sourceText: '오늘 밤 10시 오비드렐 주사',
          assignedTo: 'my_action',
          suggestedCardType: 'injection',
          scheduledAt: '2026-05-11T22:00:00.000Z',
          careDate: '2026-05-11',
          userMarkedImportant: true,
          partnerVisible: true,
        }),
      ],
    });
  });

  it('keeps card_type deterministic through inferCardType with no LLM path', () => {
    expect(inferCardType('오비드렐 주사 밤 10시', 'my_action')).toBe('injection');
  });
});
