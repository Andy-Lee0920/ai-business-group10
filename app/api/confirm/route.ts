import { NextRequest } from 'next/server';
import { type AssignedTo } from '../../../src/domain/line-split';
import { createCaptureStore, type ConfirmItem } from '../../../src/lib/capture-confirm-store';

type ConfirmBody = {
  draftId?: unknown;
  visitInputId?: unknown;
  items?: unknown;
};

const ASSIGNED_TO_VALUES: AssignedTo[] = ['my_action', 'partner_action', 'clinic_confirmation', 'excluded'];

function isAssignedTo(value: unknown): value is AssignedTo {
  return typeof value === 'string' && ASSIGNED_TO_VALUES.includes(value as AssignedTo);
}

function toConfirmItems(value: unknown): ConfirmItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value.map((item, orderIndex): ConfirmItem | null => {
    if (typeof item !== 'object' || item === null) return null;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.sourceText !== 'string' || !candidate.sourceText.trim()) return null;
    if (!isAssignedTo(candidate.assignedTo)) return null;
    return { sourceText: candidate.sourceText.trim(), assignedTo: candidate.assignedTo, orderIndex };
  });

  return items.every((item): item is ConfirmItem => item !== null) ? items : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ConfirmBody;
  const draftId = typeof body.draftId === 'string' ? body.draftId : '';
  const visitInputId = typeof body.visitInputId === 'string' ? body.visitInputId : '';
  const items = toConfirmItems(body.items);

  if (!draftId || !visitInputId || !items) return Response.json({ error: 'Valid confirmation payload is required.' }, { status: 400 });

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const result = await store.confirm({ draftId, visitInputId, items });
  return Response.json(result);
}
