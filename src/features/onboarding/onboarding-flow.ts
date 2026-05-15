import type { Medication, ScheduleType } from '../../types/slc.types';

export type OnboardingRole = 'patient' | 'partner';

export type OnboardingStep =
  | 'brand_intro'
  | 'role_selection'
  | 'patient_consent'
  | 'partner_consent'
  | 'first_schedule_interview'
  | 'first_schedule_confirm'
  | 'home';

export type ConsentCheckKey =
  | 'privacy_boundary'
  | 'sensitive_data'
  | 'clinical_boundary'
  | 'input_assist_boundary';

export const ONBOARDING_CONSENT_CHECKS = [
  {
    key: 'privacy_boundary',
    label: '개인정보 수집·이용에 동의합니다.',
    detail: '로그인, 역할, 오늘 일정 화면 제공에 필요한 정보만 사용합니다.',
  },
  {
    key: 'sensitive_data',
    label: '민감정보 처리에 동의합니다.',
    detail: '병원 안내, 약·주사 일정은 동의 후에만 저장합니다.',
  },
  {
    key: 'clinical_boundary',
    label: 'Fevio는 의료 판단을 하지 않음을 이해했습니다.',
    detail: '진단, 처방, 용량, 치료 결정은 병원 안내를 기준으로 확인합니다.',
  },
  {
    key: 'input_assist_boundary',
    label: 'AI/입력 보조는 자동 저장하지 않음을 이해했습니다.',
    detail: '제안은 임시 draft이며, 직접 확인한 일정만 저장합니다.',
  },
] as const satisfies ReadonlyArray<{ key: ConsentCheckKey; label: string; detail: string }>;

export type ConsentCheckState = Partial<Record<ConsentCheckKey, boolean>>;

export type ScheduleChip = {
  id: 'injection' | 'medication' | 'clinic';
  label: string;
  helper: string;
  scheduleType: ScheduleType;
};

export const FIRST_SCHEDULE_CHIPS = [
  { id: 'injection', label: '주사', helper: '시간 맞춰 확인할 주사 일정', scheduleType: 'injection' },
  { id: 'medication', label: '약 복용', helper: '복용하거나 사용하는 약 일정', scheduleType: 'medication' },
  { id: 'clinic', label: '병원 방문', helper: '방문·검사·시술 일정', scheduleType: 'clinic' },
] as const satisfies readonly ScheduleChip[];

export type FirstScheduleChipId = (typeof FIRST_SCHEDULE_CHIPS)[number]['id'];

export type FirstScheduleInputAssist = {
  source: 'none' | 'aliases' | 'llm';
  matchedMedicationId: string | null;
  matchedMedicationLabel: string | null;
  requiresUserConfirmation: true;
};

export type FirstScheduleDraft = {
  type: ScheduleType;
  title: string;
  scheduledAt: string;
  dose: string | null;
  unit: string | null;
  medicationId: string | null;
  optionalMemo: string | null;
  source: 'onboarding_interview';
  inputAssist: FirstScheduleInputAssist;
};

export function hasRequiredConsentChecks(checks: ConsentCheckState): boolean {
  return ONBOARDING_CONSENT_CHECKS.every((item) => checks[item.key] === true);
}

export function nextOnboardingStep(current: OnboardingStep, role?: OnboardingRole | null): OnboardingStep {
  if (current === 'brand_intro') return 'role_selection';
  if (current === 'role_selection') return role === 'partner' ? 'partner_consent' : 'patient_consent';
  if (current === 'patient_consent') return 'first_schedule_interview';
  if (current === 'partner_consent') return 'home';
  if (current === 'first_schedule_interview') return 'first_schedule_confirm';
  if (current === 'first_schedule_confirm') return 'home';
  return 'home';
}

export function resolveScheduleType(chipId: FirstScheduleChipId): ScheduleType {
  return FIRST_SCHEDULE_CHIPS.find((chip) => chip.id === chipId)?.scheduleType ?? 'clinic';
}

export function buildFirstScheduleDraft(input: {
  chipId: FirstScheduleChipId;
  title: string;
  scheduledAt: string;
  dose?: string | null;
  unit?: string | null;
  optionalMemo?: string | null;
  matchedMedication?: Pick<Medication, 'id' | 'brand_name_ko'> | null;
  assistSource?: FirstScheduleInputAssist['source'];
}): FirstScheduleDraft | null {
  const title = input.title.trim();
  const scheduledAt = input.scheduledAt.trim();
  if (!title || !scheduledAt) return null;

  return {
    type: resolveScheduleType(input.chipId),
    title,
    scheduledAt,
    dose: normalizeOptional(input.dose),
    unit: normalizeOptional(input.unit),
    medicationId: input.matchedMedication?.id ?? null,
    optionalMemo: normalizeOptional(input.optionalMemo),
    source: 'onboarding_interview',
    inputAssist: {
      source: input.matchedMedication ? (input.assistSource ?? 'aliases') : 'none',
      matchedMedicationId: input.matchedMedication?.id ?? null,
      matchedMedicationLabel: input.matchedMedication?.brand_name_ko ?? null,
      requiresUserConfirmation: true,
    },
  };
}

function normalizeOptional(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}
