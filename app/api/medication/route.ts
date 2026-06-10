import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import {
  createSensitiveCareActionCard,
  isMissingSupabasePublicConfigError,
  isPrivacyGateRequiredError,
  type SensitiveCareWriteSupabaseClient,
} from '../../../src/lib/sensitive-care-write';
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

const TYPES: MedicationType[] = [
  'medication',
  'injection',
  'vaginal',
  'general_action',
];
const REPEAT_LABELS: Record<RepeatPattern, string> = {
  once: '오늘만',
  daily: '매일',
  clinic_instruction: '병원 안내대로',
};
const DEMO_COOKIE = 'fevio_privacy_accepted=1';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as MedicationBody;
  const input = normalizeInput(body);
  if ('error' in input)
    return NextResponse.json({ error: input.error }, { status: 400 });

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
    const supabase =
      (await createCookieBackedSupabaseClient()) as unknown as SensitiveCareWriteSupabaseClient;
    const card = await createSensitiveCareActionCard(supabase, {
      sourceText,
      card: {
        assignee_role: 'primary_user',
        card_type: input.type === 'vaginal' ? 'medication' : input.type,
        title: sourceText,
        source_text: sourceText,
        scheduled_at: scheduledAtForToday(input.time),
        status: 'confirmed',
        confirmation_required: false,
        user_marked_important: input.important,
        partner_visible: true,
      },
    });

    return NextResponse.json({
      cardId: card.cardId,
      status: card.status,
      persisted: true,
      createdCardCount: 1,
      title: sourceText,
    });
  } catch (error) {
    if (isMissingSupabasePublicConfigError(error) && isDemoRequest(request)) {
      return NextResponse.json({
        cardId: `demo-medication-${Date.now()}`,
        status: 'confirmed',
        persisted: false,
        createdCardCount: 1,
        title: sourceText,
      });
    }
    if (isPrivacyGateRequiredError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}

function normalizeInput(body: MedicationBody):
  | {
      type: MedicationType;
      name: string;
      dose: string;
      doseConfirmed: true;
      time: string;
      repeat: RepeatPattern;
      important: boolean;
    }
  | { error: string } {
  const type =
    body.type === 'medication' ||
    body.type === 'injection' ||
    body.type === 'vaginal' ||
    body.type === 'general_action'
      ? body.type
      : null;
  const name = normalizeText(body.name);
  const dose = normalizeText(body.dose);
  const time = normalizeText(body.time);
  const repeat = normalizeRepeat(body.repeat);

  if (!type || !TYPES.includes(type))
    return { error: '약, 주사, 질정, 기타 중 하나를 선택해 주세요.' };
  if (!name) return { error: '이름을 짧게 적어 주세요.' };
  if (!dose) return { error: '용량은 사용자가 직접 적어야 합니다.' };
  if (body.doseConfirmed !== true)
    return { error: '용량은 사용자가 직접 확인해야 합니다.' };
  if (!/^\d{2}:\d{2}$/u.test(time))
    return { error: '시간을 HH:MM 형식으로 적어 주세요.' };

  return {
    type,
    name,
    dose,
    doseConfirmed: true,
    time,
    repeat,
    important: body.important === true,
  };
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRepeat(value: unknown): RepeatPattern {
  return value === 'daily' || value === 'clinic_instruction' ? value : 'once';
}

function buildSourceText(input: {
  type: MedicationType;
  name: string;
  dose: string;
  time: string;
  repeat: RepeatPattern;
  important: boolean;
}) {
  const methodLabel =
    input.type === 'vaginal'
      ? '질정'
      : input.type === 'injection'
        ? '주사'
        : input.type === 'medication'
          ? '약'
          : '기타';
  return [
    methodLabel,
    input.name,
    input.dose,
    input.time,
    REPEAT_LABELS[input.repeat],
    input.important ? '꼭 챙겨야 해요' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function scheduledAtForToday(time: string) {
  const [hours = '00', minutes = '00'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

function isDemoRequest(request: NextRequest) {
  return (
    request.headers
      .get('cookie')
      ?.split(';')
      .some((part) => part.trim() === DEMO_COOKIE) ?? false
  );
}
