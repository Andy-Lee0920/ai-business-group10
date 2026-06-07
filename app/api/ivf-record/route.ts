import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import { assertSensitiveWriteAllowed } from '../../../src/domain/auth-privacy';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from '../../../src/lib/couple-bootstrap-admin';
import { createConfirmedCareAction, type CanonicalCareActionRow, type CanonicalCareActionWriterClient } from '../../../src/lib/canonical-care-action-writer';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

type IvfStage = 'cos' | 'trigger' | 'opu' | 'culture' | 'transfer' | 'tww' | 'result';
type IvfRecordBody = {
  stage?: unknown;
  date?: unknown;
  outcome?: unknown;
  note?: unknown;
  shareWithPartner?: unknown;
};
type IvfRecordInput = {
  stage: IvfStage;
  stageLabel: string;
  date: string;
  outcome: string;
  note: string;
  shareWithPartner: boolean;
};
type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type RpcResult<T> = { data: T[] | T | null; error: DbError | null };
type SelectChain<T> = { select(columns: string): SelectChain<T>; single(): Promise<SingleResult<T>> };
type IvfSupabaseClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: DbError | null }> };
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'visit_inputs'): {
    insert<T>(value: Record<string, unknown>): SelectChain<T>;
  };
  from(table: 'care_action_cards'): ReturnType<CanonicalCareActionWriterClient<CardRow>['from']>;
};
type BootstrapRow = { couple_id: string; privacy_gate_accepted_at: string | null };
type VisitInputRow = { id: string };
type CardRow = CanonicalCareActionRow;

const DEMO_COOKIE = 'fevio_privacy_accepted=1';
const STAGES: Record<IvfStage, string> = {
  cos: '과배란 유도',
  trigger: '최종 성숙 주사',
  opu: '난자 채취',
  culture: '배아 배양',
  transfer: '이식',
  tww: '이식 후 대기',
  result: '결과 확인',
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as IvfRecordBody;
  const input = normalizeInput(body);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const sourceText = buildSourceText(input);
  const safeCard = buildSafeCard(input);

  if (isPresentationRequest(request) && isDemoRequest(request)) {
    return NextResponse.json({
      cardId: `demo-ivf-record-${Date.now()}`,
      status: 'confirmed',
      persisted: false,
      createdCardCount: 1,
      partnerVisible: input.shareWithPartner,
      ...safeCard,
    });
  }

  try {
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as IvfSupabaseClient;
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

    const card = await createConfirmedCareAction(supabase, {
      couple_id: bootstrap.couple_id,
      created_by: user.id,
      source_input_id: visitInput.data.id,
      assignee_role: 'primary_user',
      card_type: 'record',
      title: safeCard.title,
      description: safeCard.description,
      source_text: sourceText,
      scheduled_at: null,
      care_date: input.date,
      status: 'confirmed',
      confirmation_required: false,
      user_marked_important: false,
      partner_visible: input.shareWithPartner,
    });

    return NextResponse.json({
      cardId: card.id,
      status: card.status,
      persisted: true,
      createdCardCount: 1,
      partnerVisible: input.shareWithPartner,
      ...safeCard,
    });
  } catch (error) {
    if (isMissingConfigError(error) && isDemoRequest(request)) {
      return NextResponse.json({
        cardId: `demo-ivf-record-${Date.now()}`,
        status: 'confirmed',
        persisted: false,
        createdCardCount: 1,
        partnerVisible: input.shareWithPartner,
        ...safeCard,
      });
    }
    throw error;
  }
}

function normalizeInput(body: IvfRecordBody): IvfRecordInput | { error: string } {
  const stage = typeof body.stage === 'string' && body.stage in STAGES ? (body.stage as IvfStage) : null;
  const date = normalizeDate(body.date);
  if (!stage || !date) return { error: '시술 단계와 날짜를 확인해 주세요.' };

  return {
    stage,
    stageLabel: STAGES[stage],
    date,
    outcome: normalizeText(body.outcome, 80),
    note: normalizeText(body.note, 120),
    shareWithPartner: body.shareWithPartner === true,
  };
}

function normalizeDate(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/u.test(trimmed) ? trimmed : '';
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function buildSourceText(input: IvfRecordInput) {
  return ['IVF 기록', input.stageLabel, input.date, input.outcome || null, input.note || null].filter(Boolean).join(' · ');
}

function buildSafeCard(input: IvfRecordInput) {
  if (!input.shareWithPartner) {
    return {
      title: `IVF 기록 · ${input.stageLabel}`,
      description: '나를 위한 시술 기록이에요. 공유하지 않아도 충분해요.',
    };
  }

  return {
    title: '공유된 IVF 기록',
    description: `${input.date} ${input.stageLabel} 단계예요. 결과를 단정하지 말고 이동·회복·다음 확인을 함께 챙겨 주세요.`,
  };
}

async function getAuthenticatedUser(supabase: IvfSupabaseClient) {
  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) throw new Error(userResult.error?.message ?? 'Authentication required.');
  return userResult.data.user;
}

async function bootstrapSensitiveContext(supabase: IvfSupabaseClient, user: { id: string; email?: string | null }) {
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

function isDemoRequest(request: NextRequest) {
  return request.headers.get('cookie')?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}

function isMissingConfigError(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}
