import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import { computeCareDay } from '../../../../src/domain/care-cards';
import { deriveRoleBasedHomeIntent, type RoleContext } from '../../../../src/domain/care-os-architecture';
import { createCaptureStore, type ConfirmItem } from '../../../../src/lib/capture-confirm-store';
import type { CardType, CareActionCard } from '../../../../src/types/care-cards.types';

type FirstItemKind = 'schedule' | 'medication' | 'injection';
type OnboardingBody = {
  treatmentContext?: unknown;
  treatmentExperience?: unknown;
  baselineProfile?: unknown;
  roleContext?: unknown;
  partnerInviteSkipped?: unknown;
  partnerInviteEmail?: unknown;
  firstItem?: unknown;
};

type FirstItem = {
  kind: FirstItemKind;
  text: string;
};

type BaselineProfile = {
  age: string;
  heightCm: string;
  weightKg: string;
  medicalNotes: string;
};

const FIRST_ITEM_CARD_TYPE: Record<FirstItemKind, CardType> = {
  schedule: 'clinic_visit',
  medication: 'medication',
  injection: 'injection',
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as OnboardingBody;
  const treatmentContext = normalizeText(body.treatmentContext);
  const treatmentExperience = normalizeText(body.treatmentExperience);
  const baselineProfile = normalizeBaselineProfile(body.baselineProfile);
  const roleContext = normalizeRoleContext(body.roleContext);
  const firstItem = normalizeFirstItem(body.firstItem);

  if (!treatmentContext) return NextResponse.json({ error: 'Treatment context is required.' }, { status: 400 });
  if (firstItem === 'invalid') return NextResponse.json({ error: 'One valid first schedule, medication, or injection item is required.' }, { status: 400 });

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const rawText = buildOnboardingCaptureText({ treatmentContext, treatmentExperience, baselineProfile, firstItem });
  const capture = await store.createCapture(rawText);
  const items = firstItem ? [toConfirmItem(firstItem)] : [];
  const result = await store.confirm({ ...capture, items });
  const now = new Date();
  const careDay = computeCareDay({
    hasEverCaptured: true,
    cards: firstItem ? [toCareActionCard(firstItem, store.coupleId, now)] : [],
    now,
  });

  const response = NextResponse.json({
    redirectTo: '/home',
    careDay,
    createdCardCount: result.createdCardCount,
    partnerInvite: 'skipped',
    roleContext,
    homeIntent: deriveRoleBasedHomeIntent({ roleContext, partnerInviteSkipped: body.partnerInviteSkipped !== false }),
  });

  response.cookies.set('fevio_onboarding_role_context', roleContext, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  if (firstItem && isPresentationRequest(request)) {
    response.cookies.set('fevio_onboarding_first_card', encodeURIComponent(JSON.stringify(toCareActionCard(firstItem, store.coupleId, now))), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}


function normalizeRoleContext(value: unknown): RoleContext {
  if (value === 'patient' || value === 'partner' || value === 'together' || value === 'primary_solo' || value === 'primary_with_partner') return value;
  return 'patient';
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFirstItem(value: unknown): FirstItem | 'invalid' | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return 'invalid';
  if (typeof value !== 'object') return 'invalid';

  const candidate = value as Record<string, unknown>;
  const kind = candidate.kind;
  const text = normalizeText(candidate.text);
  if (kind !== 'schedule' && kind !== 'medication' && kind !== 'injection') return 'invalid';
  if (!text) return 'invalid';

  return { kind, text };
}

function normalizeBaselineProfile(value: unknown): BaselineProfile | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const age = normalizeText(candidate.age);
  const heightCm = normalizeText(candidate.heightCm);
  const weightKg = normalizeText(candidate.weightKg);
  const medicalNotes = normalizeText(candidate.medicalNotes);
  if (!age && !heightCm && !weightKg && !medicalNotes) return null;
  return { age, heightCm, weightKg, medicalNotes };
}

function buildOnboardingCaptureText({
  treatmentContext,
  treatmentExperience,
  baselineProfile,
  firstItem,
}: {
  treatmentContext: string;
  treatmentExperience: string;
  baselineProfile: BaselineProfile | null;
  firstItem: FirstItem | null;
}) {
  const lines = [];
  if (treatmentExperience) lines.push(`시술 경험: ${treatmentExperience}`);
  if (baselineProfile?.age) lines.push(`나이: ${baselineProfile.age}`);
  if (baselineProfile?.heightCm) lines.push(`신장: ${baselineProfile.heightCm}cm`);
  if (baselineProfile?.weightKg) lines.push(`체중: ${baselineProfile.weightKg}kg`);
  if (baselineProfile?.medicalNotes) lines.push(`주의사항: ${baselineProfile.medicalNotes}`);
  lines.push(`치료 상황: ${treatmentContext}`);
  if (firstItem) lines.push(`첫 항목: ${firstItem.text}`);
  return lines.join('\n');
}

function toConfirmItem(firstItem: FirstItem): ConfirmItem {
  return {
    sourceText: firstItem.text,
    assignedTo: 'my_action',
    orderIndex: 0,
    userSelectedCardType: FIRST_ITEM_CARD_TYPE[firstItem.kind],
  };
}

function toCareActionCard(firstItem: FirstItem, coupleId: string, now: Date): CareActionCard {
  const cardType = FIRST_ITEM_CARD_TYPE[firstItem.kind];
  return {
    id: `onboarding-${firstItem.kind}`,
    couple_id: coupleId,
    created_by: 'onboarding',
    assignee_role: 'primary_user',
    card_type: cardType,
    title: firstItem.text,
    description: null,
    source_text: firstItem.text,
    scheduled_at: cardType === 'clinic_visit' ? null : now.toISOString(),
    care_date: cardType === 'clinic_visit' ? now.toISOString().slice(0, 10) : null,
    status: 'confirmed',
    confirmation_required: false,
    user_marked_important: false,
    partner_visible: false,
    revision: 1,
  };
}
