import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/protocol-drafts/route';
import { createCaptureStore, type CaptureStore } from '../../src/lib/capture-confirm-store';

vi.mock('../../src/lib/capture-confirm-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/capture-confirm-store')>();
  return { ...actual, createCaptureStore: vi.fn() };
});

const mockedCreateStore = vi.mocked(createCaptureStore);

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/protocol-drafts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/protocol-drafts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores the raw instruction and returns draft-only suggestions without confirming cards', async () => {
    const createCapture = vi.fn().mockResolvedValue({ visitInputId: 'visit-1', draftId: 'draft-1' });
    const confirm = vi.fn();
    mockedCreateStore.mockResolvedValue({ coupleId: 'couple-1', createCapture, confirm } satisfies CaptureStore);

    const response = await POST(jsonRequest({ rawInstruction: '오늘 밤 10시 오비드렐 주사\n내일 병원 채혈' }));
    const payload = (await response.json()) as { status: string; drafts: Array<{ sourceText: string; suggestedCardType: string }> };

    expect(response.status).toBe(200);
    expect(createCapture).toHaveBeenCalledWith('오늘 밤 10시 오비드렐 주사\n내일 병원 채혈');
    expect(confirm).not.toHaveBeenCalled();
    expect(payload.status).toBe('draft_only');
    expect(payload.drafts.map((item) => item.suggestedCardType)).toEqual(['injection', 'clinic_visit']);
  });
});
