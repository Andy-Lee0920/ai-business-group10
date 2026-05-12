import { NextRequest, NextResponse } from 'next/server';
import { computeCareDay } from '../../../../src/domain/care-cards';
import { deriveRoleBasedHomeIntent, type RoleContext } from '../../../../src/domain/care-os-architecture';
import { defaultSharingLevelByStage, inferStageFromCareItem, type IvfStage, type SelectedIntent, type SharingLevel } from '../../../../src/domain/onboarding-care-state';
import { createCaptureStore, type ConfirmItem } from '../../../../src/lib/capture-confirm-store';
import type { CardType, CareActionCard } from '../../../../src/types/care-cards.types';

type FirstItemKind = 'schedule' | 'medication' | 'injection';
type OnboardingBody = {
  treatmentContext?: unknown;
  treatmentExperience?: unknown;
  baselineProfile?: unknown;
  firstCareItem?: unknown;
  inferredStage?: unknown;
  effectiveStage?: unknown;
  sharingLevel?: unknown;
  partnerInvite?: unknown;
  roleContext?: unknown;
  partnerInviteSkipped?: unknown;
  partnerInviteEmail?: unknown;
  firstItem?: unknown;
};

type FirstItem = {
  kind: FirstItemKind;
  text: string;
};

type FirstCareItem = {
  selectedIntent: SelectedIntent;
  rawText: string;
  medicalNotes: string;
  attachmentCount: number;
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
  const firstCareItem = normalizeFirstCareItem(body.firstCareItem);
  const legacyFirstItem = normalizeFirstItem(body.firstItem);
  const firstItem = firstCareItem ? toFirstItem(firstCareItem) : legacyFirstItem;
  const effectiveStage = normalizeIvfStage(body.effectiveStage) ?? (firstCareItem ? inferStageFromCareItem({ selectedIntent: firstCareItem.selectedIntent, rawText: firstCareItem.rawText }).inferredStage : null);
  const sharingLevel = normalizeSharingLevel(body.sharingLevel) ?? (effectiveStage ? defaultSharingLevelByStage(effectiveStage) : 'basic');
  const partnerInviteIntent = normalizePartnerInviteIntent(body.partnerInvite) ?? (roleContext === 'primary_with_partner' ? 'prepare_invite' : 'skip');

  if (!treatmentContext && !firstCareItem) return NextResponse.json({ error: 'First care item is required.' }, { status: 400 });
  if (firstItem === 'invalid') return NextResponse.json({ error: 'One valid first schedule, medication, or injection item is required.' }, { status: 400 });

  const store = await createCaptureStore(request);
  if (store instanceof Response) return store;

  const rawText = buildOnboardingCaptureText({ treatmentContext, treatmentExperience, baselineProfile, firstItem, firstCareItem, effectiveStage, sharingLevel, roleContext });
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
    partnerInvite: partnerInviteIntent,
    roleContext,
    sharingLevel,
    effectiveStage,
    homeIntent: deriveRoleBasedHomeIntent({ roleContext, partnerInviteSkipped: partnerInviteIntent !== 'prepare_invite' }),
  });

  response.cookies.set('fevio_onboarding_role_context', roleContext, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  response.cookies.set('fevio_onboarding_sharing_level', sharingLevel, { httpOnly: true, sameSite: 'lax', path: '/' });
  response.cookies.set('fevio_onboarding_partner_invite', partnerInviteIntent, { httpOnly: true, sameSite: 'lax', path: '/' });
  if (effectiveStage) response.cookies.set('fevio_onboarding_effective_stage', effectiveStage, { httpOnly: true, sameSite: 'lax', path: '/' });

  if (firstItem) {
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
  return 'primary_solo';
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

function normalizeFirstCareItem(value: unknown): FirstCareItem | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const selectedIntent = normalizeSelectedIntent(candidate.selectedIntent);
  const rawText = normalizeText(candidate.rawText);
  const medicalNotes = normalizeText(candidate.medicalNotes);
  const attachments = Array.isArray(candidate.attachments) ? candidate.attachments : [];
  return { selectedIntent, rawText, medicalNotes, attachmentCount: attachments.length };
}

function normalizeSelectedIntent(value: unknown): SelectedIntent {
  if (value === 'medication' || value === 'clinic_visit' || value === 'procedure' || value === 'result_waiting' || value === 'post_transfer' || value === 'pregnancy_test' || value === 'unknown') return value;
  return 'unknown';
}

function normalizeIvfStage(value: unknown): IvfStage | null {
  if (value === 'baseline_testing' || value === 'ovarian_stimulation' || value === 'egg_retrieval' || value === 'fertilization' || value === 'embryo_culture' || value === 'embryo_transfer' || value === 'pregnancy_test') return value;
  return null;
}

function normalizeSharingLevel(value: unknown): SharingLevel | null {
  return value === 'basic' || value === 'care' ? value : null;
}

function normalizePartnerInviteIntent(value: unknown) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const intent = (value as Record<string, unknown>).intent;
  return intent === 'skip' || intent === 'prepare_invite' ? intent : null;
}

function toFirstItem(firstCareItem: FirstCareItem): FirstItem | null {
  const text = firstCareItem.rawText || (firstCareItem.attachmentCount > 0 ? '사진으로 추가한 병원 안내' : '');
  if (!text) return null;
  return { kind: firstItemKindForIntent(firstCareItem.selectedIntent, text), text };
}

function firstItemKindForIntent(intent: SelectedIntent, text: string): FirstItemKind {
  if (intent === 'clinic_visit' || intent === 'procedure' || /방문|검사|예약|채취|시술/u.test(text)) return 'schedule';
  if (intent === 'medication' && /주사|오비드렐|고날|퓨리곤|세트로|트리거/u.test(text)) return 'injection';
  if (intent === 'medication') return 'medication';
  if (intent === 'post_transfer' || intent === 'pregnancy_test' || intent === 'result_waiting') return 'schedule';
  return /주사/u.test(text) ? 'injection' : 'schedule';
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
  firstCareItem,
  effectiveStage,
  sharingLevel,
  roleContext,
}: {
  treatmentContext: string;
  treatmentExperience: string;
  baselineProfile: BaselineProfile | null;
  firstItem: FirstItem | null;
  firstCareItem: FirstCareItem | null;
  effectiveStage: IvfStage | null;
  sharingLevel: SharingLevel;
  roleContext: RoleContext;
}) {
  const lines = [];
  if (treatmentExperience) lines.push(`시술 경험: ${treatmentExperience}`);
  if (baselineProfile?.age) lines.push(`나이: ${baselineProfile.age}`);
  if (baselineProfile?.heightCm) lines.push(`신장: ${baselineProfile.heightCm}cm`);
  if (baselineProfile?.weightKg) lines.push(`체중: ${baselineProfile.weightKg}kg`);
  if (baselineProfile?.medicalNotes) lines.push(`주의사항: ${baselineProfile.medicalNotes}`);
  if (firstCareItem?.medicalNotes) lines.push(`주의사항: ${firstCareItem.medicalNotes}`);
  if (treatmentContext) lines.push(`치료 상황: ${treatmentContext}`);
  if (firstCareItem) lines.push(`선택 안내: ${firstCareItem.selectedIntent}`);
  if (effectiveStage) lines.push(`추론 단계: ${effectiveStage}`);
  lines.push(`역할 설정: ${roleContext}`);
  lines.push(`공유 범위: ${sharingLevel}`);
  if (firstCareItem?.attachmentCount) lines.push(`첨부 사진: ${firstCareItem.attachmentCount}개`);
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
