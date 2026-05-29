import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import {
  createSensitiveCareActionCard,
  isMissingSupabasePublicConfigError,
  isPrivacyGateRequiredError,
  type SensitiveCareWriteSupabaseClient,
} from '../../../src/lib/sensitive-care-write';

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
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as SensitiveCareWriteSupabaseClient;
    const card = await createSensitiveCareActionCard(supabase, {
      sourceText,
      card: {
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
      },
    });

    return NextResponse.json({
      cardId: card.cardId,
      status: card.status,
      persisted: true,
      createdCardCount: 1,
      partnerVisible: input.shareWithPartner,
      ...safeCard,
    });
  } catch (error) {
    if (isPrivacyGateRequiredError(error)) return NextResponse.json({ error: error.message }, { status: 403 });
    if (isMissingSupabasePublicConfigError(error) && isDemoRequest(request)) {
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

function isDemoRequest(request: NextRequest) {
  return request.headers.get('cookie')?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}
