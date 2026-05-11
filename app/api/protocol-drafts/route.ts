import { NextRequest } from 'next/server';
import { createProtocolDraft } from '../../../src/domain/protocol-draft';
import { createCaptureStore } from '../../../src/lib/capture-confirm-store';

type Body = { rawInstruction?: unknown };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const rawInstruction = typeof body.rawInstruction === 'string' ? body.rawInstruction.trim() : '';
  if (!rawInstruction) return Response.json({ error: '병원 안내문을 붙여넣거나 적어 주세요.' }, { status: 400 });

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const capture = await store.createCapture(rawInstruction);
  return Response.json({
    ...capture,
    status: 'draft_only',
    drafts: createProtocolDraft(rawInstruction),
    message: '확정 전 초안이에요. 홈에는 아직 반영하지 않았어요.',
  });
}
