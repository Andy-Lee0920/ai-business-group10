import { NextRequest } from 'next/server';
import { type AssignedTo, type CardType } from '../../../src/domain/line-split';
import { CARD_TYPES } from '../../../src/types/care-cards.types';
import { createCaptureStore, type ConfirmItem } from '../../../src/lib/capture-confirm-store';

type ConfirmBody = {
  draftId?: unknown;
  visitInputId?: unknown;
  items?: unknown;
};

const ASSIGNED_TO_VALUES: AssignedTo[] = ['my_action', 'partner_action', 'clinic_confirmation', 'excluded'];

function isCardType(value: unknown): value is CardType {
  return typeof value === 'string' && (CARD_TYPES as readonly string[]).includes(value);
}

function optionalIso(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function optionalDate(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : null;
}

function optionalOffset(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

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
    const sourceOffsetStart = optionalOffset(candidate.sourceOffsetStart);
    const sourceOffsetEnd = optionalOffset(candidate.sourceOffsetEnd);
    const hasValidSourceOffset = sourceOffsetStart !== null && sourceOffsetEnd !== null && sourceOffsetEnd >= sourceOffsetStart;
    return {
      sourceText: candidate.sourceText.trim(),
      sourceOffsetStart: hasValidSourceOffset ? sourceOffsetStart : null,
      sourceOffsetEnd: hasValidSourceOffset ? sourceOffsetEnd : null,
      assignedTo: candidate.assignedTo,
      orderIndex,
      userSelectedCardType: isCardType(candidate.userSelectedCardType) ? candidate.userSelectedCardType : null,
      suggestedCardType: isCardType(candidate.suggestedCardType) ? candidate.suggestedCardType : null,
      scheduledAt: optionalIso(candidate.scheduledAt),
      careDate: optionalDate(candidate.careDate),
      description: typeof candidate.description === 'string' ? candidate.description.trim().slice(0, 240) : null,
      userMarkedImportant: candidate.userMarkedImportant === true,
      partnerVisible: candidate.partnerVisible === true,
    };
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
