import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import { createCaptureStore, type ConfirmItem } from '../../../src/lib/capture-confirm-store';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { CardType } from '../../../src/types/care-cards.types';

type MedicationType = 'medication' | 'injection' | 'general_action';
type RepeatPattern = 'once' | 'daily' | 'clinic_instruction';
type MedicationBody = {
  type?: unknown;
  name?: unknown;
  dose?: unknown;
  doseConfirmed?: unknown;
  time?: unknown;
  repeat?: unknown;
  important?: unknown;
};
type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type QueryChain<T> = {
  select(columns: string): QueryChain<T>;
  eq(column: string, value: string): QueryChain<T>;
  order(column: string, options?: Record<string, unknown>): QueryChain<T>;
  limit(count: number): QueryChain<T>;
  single(): Promise<SingleResult<T>>;
};
type UpdateChain<T> = {
  eq(column: string, value: string): UpdateChain<T>;
  select(columns: string): UpdateChain<T>;
  single(): Promise<SingleResult<T>>;
};
type MedicationSupabaseClient = {
  from(table: 'care_action_cards'): {
    select<T>(columns: string): QueryChain<T>;
    update<T>(value: Record<string, unknown>): UpdateChain<T>;
  };
};
type CardRow = { id: string; status: string };

const TYPES: MedicationType[] = ['medication', 'injection', 'general_action'];
const REPEAT_LABELS: Record<RepeatPattern, string> = {
  once: '오늘만',
  daily: '매일',
  clinic_instruction: '병원 안내대로',
};
const DEMO_COOKIE = 'fevio_privacy_accepted=1';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as MedicationBody;
  const input = normalizeInput(body);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const sourceText = buildSourceText(input);
  const capture = await store.createCapture(sourceText);
  const item: ConfirmItem = {
    sourceText,
    assignedTo: 'my_action',
    orderIndex: 0,
    userSelectedCardType: input.type,
  };
  const result = await store.confirm({ ...capture, items: [item] });
  if (result.createdCardCount !== 1) {
    return NextResponse.json({ error: 'One confirmed medication card is required.' }, { status: 500 });
  }

  const card = await findAndDecorateCard(request, capture.visitInputId, input);
  if (card instanceof Response) return card;

  return NextResponse.json({
    cardId: card.id,
    status: card.status,
    createdCardCount: result.createdCardCount,
    title: sourceText,
  });
}

function normalizeInput(body: MedicationBody):
  | { type: MedicationType; name: string; dose: string; doseConfirmed: true; time: string; repeat: RepeatPattern; important: boolean }
  | { error: string } {
  const type = body.type === 'medication' || body.type === 'injection' || body.type === 'general_action' ? body.type : null;
  const name = normalizeText(body.name);
  const dose = normalizeText(body.dose);
  const time = normalizeText(body.time);
  const repeat = normalizeRepeat(body.repeat);

  if (!type || !TYPES.includes(type)) return { error: '약, 주사, 기타 중 하나를 선택해 주세요.' };
  if (!name) return { error: '이름을 짧게 적어 주세요.' };
  if (!dose) return { error: '용량은 사용자가 직접 적어야 합니다.' };
  if (body.doseConfirmed !== true) return { error: '용량은 사용자가 직접 확인해야 합니다.' };
  if (!/^\d{2}:\d{2}$/u.test(time)) return { error: '시간을 HH:MM 형식으로 적어 주세요.' };

  return { type, name, dose, doseConfirmed: true, time, repeat, important: body.important === true };
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRepeat(value: unknown): RepeatPattern {
  return value === 'daily' || value === 'clinic_instruction' ? value : 'once';
}

function buildSourceText(input: { name: string; dose: string; time: string; repeat: RepeatPattern; important: boolean }) {
  return [input.name, input.dose, input.time, REPEAT_LABELS[input.repeat], input.important ? '꼭 챙겨야 해요' : null].filter(Boolean).join(' · ');
}

async function findAndDecorateCard(
  request: NextRequest,
  visitInputId: string,
  input: { type: CardType; time: string; important: boolean },
): Promise<CardRow | Response> {
  try {
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as MedicationSupabaseClient;
    const selected = await supabase
      .from('care_action_cards')
      .select<CardRow>('id,status')
      .eq('source_input_id', visitInputId)
      .eq('card_type', input.type)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (selected.error || !selected.data) throw new Error(selected.error?.message ?? 'Confirmed card lookup failed.');

    const updated = await supabase
      .from('care_action_cards')
      .update<CardRow>({
        scheduled_at: scheduledAtForToday(input.time),
        user_marked_important: input.important,
        partner_visible: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selected.data.id)
      .select('id,status')
      .single();

    if (updated.error || !updated.data) throw new Error(updated.error?.message ?? 'Confirmed card update failed.');
    return updated.data;
  } catch (error) {
    if (isMissingConfigError(error) && isDemoRequest(request)) {
      return { id: `demo-medication-${Date.now()}`, status: 'confirmed' };
    }
    if (isPresentationRequest(request) && isDemoRequest(request)) {
      return { id: `demo-medication-${Date.now()}`, status: 'confirmed' };
    }
    throw error;
  }
}

function scheduledAtForToday(time: string) {
  const [hours = '00', minutes = '00'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

function isDemoRequest(request: NextRequest) {
  return request.headers.get('cookie')?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}

function isMissingConfigError(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}
