import { NextRequest } from 'next/server';
import { splitLines } from '../../../src/domain/line-split';
import { createCaptureStore } from '../../../src/lib/capture-confirm-store';

type CaptureBody = { rawText?: unknown };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CaptureBody;
  const rawText = typeof body.rawText === 'string' ? body.rawText.trim() : '';

  if (!rawText) return Response.json({ error: 'Capture text is required.' }, { status: 400 });

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const saved = await store.createCapture(rawText);
  const candidates = splitLines(rawText).map((sourceText, orderIndex) => ({
    id: `${saved.draftId}-${orderIndex}`,
    sourceText,
    assignedTo: null,
    suggestedCardType: null,
    confidence: 'high' as const,
    uncertaintyReason: null,
    orderIndex,
  }));

  return Response.json({ ...saved, candidates });
}
