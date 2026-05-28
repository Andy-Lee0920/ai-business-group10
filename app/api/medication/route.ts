import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import { assertSensitiveWriteAllowed } from '../../../src/domain/auth-privacy';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from '../../../src/lib/couple-bootstrap-admin';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { CardType } from '../../../src/types/care-cards.types';

type MedicationType = 'medication' | 'injection' | 'vaginal' | 'general_action';
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
type RpcResult<T> = { data: T[] | T | null; error: DbError | null };
type SelectChain<T> = { select(columns: string): SelectChain<T>; single(): Promise<SingleResult<T>> };
type MedicationSupabaseClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: DbError | null }> };
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'visit_inputs' | 'care_action_cards'): {
    insert<T>(value: Record<string, unknown>): SelectChain<T>;
  };
};
type BootstrapRow = { couple_id: string; privacy_gate_accepted_at: string | null };
type VisitInputRow = { id: string };
type CardRow = { id: string; status: string };

const TYPES: MedicationType[] = ['medication', 'injection', 'vaginal', 'general_action'];
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

  const sourceText = buildSourceText(input);

  if (isPresentationRequest(request) && isDemoRequest(request)) {
    return NextResponse.json({
      cardId: `demo-medication-${Date.now()}`,
      status: 'confirmed',
      persisted: false,
      createdCardCount: 1,
      title: sourceText,
    });
  }

  try {
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as MedicationSupabaseClient;
    const user = await getAuthenticatedUser(supabase);
    const bootstrap = await bootstrapSensitiveContext(supabase, user);
    try {
      assertSensitiveWriteAllowed({ privacyGateAcceptedAt: bootstrap.privacy_gate_accepted_at });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Privacy Gate must be accepted')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      throw error;
    }

    const visitInput = await supabase
      .from('visit_inputs')
      .insert<VisitInputRow>({ couple_id: bootstrap.couple_id, raw_text: sourceText })
      .select('id')
      .single();
    if (visitInput.error || !visitInput.data) throw new Error(visitInput.error?.message ?? 'visit_inputs insert failed');

    const card = await supabase
      .from('care_action_cards')
      .insert<CardRow>({
        couple_id: bootstrap.couple_id,
        created_by: user.id,
        source_input_id: visitInput.data.id,
        assignee_role: 'primary_user',
        card_type: input.type === 'vaginal' ? 'medication' : input.type,
        title: sourceText,
        source_text: sourceText,
        scheduled_at: scheduledAtForToday(input.time),
        status: 'confirmed',
        confirmation_required: false,
        user_marked_important: input.important,
        partner_visible: true,
      })
      .select('id,status')
      .single();
    if (card.error || !card.data) throw new Error(card.error?.message ?? 'care_action_cards insert failed');

    return NextResponse.json({
      cardId: card.data.id,
      status: card.data.status,
      persisted: true,
      createdCardCount: 1,
      title: sourceText,
    });
  } catch (error) {
    if (isMissingConfigError(error) && isDemoRequest(request)) {
      return NextResponse.json({
        cardId: `demo-medication-${Date.now()}`,
        status: 'confirmed',
        persisted: false,
        createdCardCount: 1,
        title: sourceText,
      });
    }
    throw error;
  }
}

function normalizeInput(body: MedicationBody):
  | { type: MedicationType; name: string; dose: string; doseConfirmed: true; time: string; repeat: RepeatPattern; important: boolean }
  | { error: string } {
  const type = body.type === 'medication' || body.type === 'injection' || body.type === 'vaginal' || body.type === 'general_action' ? body.type : null;
  const name = normalizeText(body.name);
  const dose = normalizeText(body.dose);
  const time = normalizeText(body.time);
  const repeat = normalizeRepeat(body.repeat);

  if (!type || !TYPES.includes(type)) return { error: '약, 주사, 질정, 기타 중 하나를 선택해 주세요.' };
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

function buildSourceText(input: { type: MedicationType; name: string; dose: string; time: string; repeat: RepeatPattern; important: boolean }) {
  const methodLabel = input.type === 'vaginal' ? '질정' : input.type === 'injection' ? '주사' : input.type === 'medication' ? '약' : '기타';
  return [methodLabel, input.name, input.dose, input.time, REPEAT_LABELS[input.repeat], input.important ? '꼭 챙겨야 해요' : null].filter(Boolean).join(' · ');
}

async function getAuthenticatedUser(supabase: MedicationSupabaseClient) {
  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) throw new Error(userResult.error?.message ?? 'Authentication required.');
  return userResult.data.user;
}

async function bootstrapSensitiveContext(supabase: MedicationSupabaseClient, user: { id: string; email?: string | null }) {
  const bootstrap = await supabase.rpc<BootstrapRow>('init_couple_for_user');
  if (!bootstrap.error) {
    const row = firstRow(bootstrap.data);
    if (!row) throw new Error('Couple shell missing.');
    return row;
  }

  if (!isInitCoupleAmbiguityError(bootstrap.error)) throw new Error(bootstrap.error.message);
  const shell = await bootstrapCoupleForUserWithServiceRole(user);
  return { couple_id: shell.couple_id, privacy_gate_accepted_at: shell.privacy_gate_accepted_at };
}

function firstRow<T>(value: T[] | T | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
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
