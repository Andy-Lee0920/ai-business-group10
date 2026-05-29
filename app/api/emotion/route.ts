import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import {
  createSensitiveCareActionCard,
  isMissingSupabasePublicConfigError,
  isPrivacyGateRequiredError,
  type SensitiveCareWriteSupabaseClient,
} from '../../../src/lib/sensitive-care-write';

type EmotionMood = 'overwhelmed' | 'lonely' | 'anxious' | 'tired' | 'okay';
type EmotionBody = {
  mood?: unknown;
  intensity?: unknown;
  note?: unknown;
  shareWithPartner?: unknown;
};
type EmotionInput = {
  mood: EmotionMood;
  moodLabel: string;
  partnerMoodLabel: string;
  intensity: number;
  note: string;
  shareWithPartner: boolean;
};

const DEMO_COOKIE = 'fevio_privacy_accepted=1';
const MOODS: Record<EmotionMood, { label: string; partnerLabel: string }> = {
  overwhelmed: { label: '버거워요', partnerLabel: '부담이 큰' },
  lonely: { label: '혼자인 것 같아요', partnerLabel: '혼자 감당하는 느낌이 큰' },
  anxious: { label: '불안해요', partnerLabel: '마음이 많이 긴장된' },
  tired: { label: '지쳤어요', partnerLabel: '몸과 마음이 지친' },
  okay: { label: '차분해요', partnerLabel: '차분히 지나가는' },
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as EmotionBody;
  const input = normalizeInput(body);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const sourceText = buildSourceText(input);
  const safeCard = buildSafeCard(input);

  if (isPresentationRequest(request) && isDemoRequest(request)) {
    return NextResponse.json({
      cardId: `demo-emotion-${Date.now()}`,
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
        cardId: `demo-emotion-${Date.now()}`,
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

function normalizeInput(body: EmotionBody): EmotionInput | { error: string } {
  const mood = typeof body.mood === 'string' && body.mood in MOODS ? (body.mood as EmotionMood) : null;
  if (!mood) return { error: '지금 감정에 가까운 항목을 하나만 골라 주세요.' };

  const intensity = normalizeIntensity(body.intensity);
  const note = normalizeNote(body.note);
  const moodCopy = MOODS[mood];

  return {
    mood,
    moodLabel: moodCopy.label,
    partnerMoodLabel: moodCopy.partnerLabel,
    intensity,
    note,
    shareWithPartner: body.shareWithPartner === true,
  };
}

function normalizeIntensity(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return 3;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function normalizeNote(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 120) : '';
}

function buildSourceText(input: EmotionInput) {
  return ['감정 기록', input.moodLabel, `강도 ${input.intensity}/5`, input.note || null].filter(Boolean).join(' · ');
}

function buildSafeCard(input: EmotionInput) {
  if (!input.shareWithPartner) {
    return {
      title: `감정 기록 · ${input.moodLabel}`,
      description: '나를 위한 비공개 감정 기록이에요. 공유하지 않아도 충분해요.',
    };
  }

  return {
    title: '공유된 감정 신호',
    description: `오늘은 ${input.partnerMoodLabel} 날이에요. 해결책보다 조용한 도움을 먼저 건네 주세요.`,
  };
}

function isDemoRequest(request: NextRequest) {
  return request.headers.get('cookie')?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}
