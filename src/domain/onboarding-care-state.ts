import type { TreatmentMilestoneKind } from '../types/treatment-timeline.types';

export type IvfStage =
  | 'baseline_testing'
  | 'ovarian_stimulation'
  | 'egg_retrieval'
  | 'fertilization'
  | 'embryo_culture'
  | 'embryo_transfer'
  | 'pregnancy_test';

export type SelectedIntent =
  | 'medication'
  | 'clinic_visit'
  | 'procedure'
  | 'result_waiting'
  | 'post_transfer'
  | 'pregnancy_test'
  | 'unknown';

export type StageInferenceConfidence = 'high' | 'medium' | 'low';
export type StageInferenceReason = 'intent_match' | 'keyword_match' | 'ambiguous_result_waiting' | 'generic_clinic_visit' | 'unknown';
export type SharingLevel = 'basic' | 'care';

export type OnboardingCareDay = 'injection_day' | 'clinic_day' | 'waiting_day' | 'two_week_wait_day' | 'result_protection_day';

export type InitialCareCycleState = {
  source: 'onboarding';
  version: 1;
  cycleId: string;
  inferredStage: IvfStage;
  effectiveStage: IvfStage;
  stageUserCorrected: boolean;
  careDay: OnboardingCareDay;
  roleContext: 'primary_solo' | 'primary_with_partner' | 'patient' | 'partner' | 'together';
  sharingLevel: SharingLevel;
  partnerInvite: 'prepare_invite' | 'skip';
  firstCareItem: {
    selectedIntent: SelectedIntent;
    rawText: string;
    medicalNotes: string;
    attachmentCount: number;
  } | null;
};

export type StageInference = {
  inferredStage: IvfStage;
  confidence: StageInferenceConfidence;
  reason: StageInferenceReason;
  userConfirmed?: boolean;
  userCorrectedStage?: IvfStage;
};

export const IVF_STAGE_LABELS: Record<IvfStage, { index: number; label: string; shortLabel: string }> = {
  baseline_testing: { index: 1, label: '사전 검사', shortLabel: '검사' },
  ovarian_stimulation: { index: 2, label: '배란 유도', shortLabel: '주사' },
  egg_retrieval: { index: 3, label: '난자 채취', shortLabel: '채취' },
  fertilization: { index: 4, label: '수정 준비', shortLabel: '수정 결과' },
  embryo_culture: { index: 5, label: '배아 배양', shortLabel: '배아 결과' },
  embryo_transfer: { index: 6, label: '배아 이식', shortLabel: '이식 후' },
  pregnancy_test: { index: 7, label: '임신 확인', shortLabel: '피검' },
};

export type IvfStageExplanation = {
  headline: string;
  body: string;
  boundary: string;
};

export const IVF_STAGE_EXPLANATIONS: Record<IvfStage, IvfStageExplanation> = {
  baseline_testing: {
    headline: '검사와 첫 방문 내용을 확인하는 단계예요.',
    body: '초음파, 채혈, 초진 예약처럼 병원이 확인하라고 한 일정만 먼저 정리해요.',
    boundary: '검사 결과 해석이나 치료 판단은 하지 않아요.',
  },
  ovarian_stimulation: {
    headline: '난포를 키우는 동안 약·주사 시간을 지키는 단계예요.',
    body: '약 이름, 용량, 시간, 다음 내원처럼 놓치면 안 되는 실행 항목을 앞에 둬요.',
    boundary: '용량 변경이나 주사법 판단은 병원 안내를 기준으로 직접 확인해야 해요.',
  },
  egg_retrieval: {
    headline: '난자를 채취하는 시술 전후 일정을 확인하는 단계예요.',
    body: '내원 시간, 금식, 이동, 회복 준비처럼 병원에서 확정한 행동만 보여줘요.',
    boundary: '채취 결과나 예후를 단정하지 않아요.',
  },
  fertilization: {
    headline: '수정 결과 연락을 기다리며 다음 안내를 확인하는 단계예요.',
    body: '연락 예정일과 병원이 요청한 확인 사항을 조용히 남겨둬요.',
    boundary: '수정 가능성이나 결과를 예측하지 않아요.',
  },
  embryo_culture: {
    headline: '배아 배양 결과 연락을 기다리는 단계예요.',
    body: '배양, 동결, 다음 연락처럼 사용자가 확인할 일정과 메모만 정리해요.',
    boundary: '배아 등급이나 결과 의미를 해석하지 않아요.',
  },
  embryo_transfer: {
    headline: '배아 이식 전후 안내를 지키는 단계예요.',
    body: '이식 시간, 복약, 휴식, 다음 확인일처럼 확정된 실행 항목을 정리해요.',
    boundary: '착상 여부나 성공 가능성을 말하지 않아요.',
  },
  pregnancy_test: {
    headline: '피검 또는 결과 확인 일정을 기다리는 단계예요.',
    body: '결과 확인 시간과 공유 범위를 사용자가 정한 대로만 보여줘요.',
    boundary: '증상으로 결과를 판단하거나 결과 확인을 재촉하지 않아요.',
  },
};

export const TREATMENT_MILESTONE_STAGE: Record<TreatmentMilestoneKind, IvfStage> = {
  initial_visit: 'baseline_testing',
  stimulation_start: 'ovarian_stimulation',
  trigger_shot: 'ovarian_stimulation',
  egg_retrieval: 'egg_retrieval',
  embryo_transfer: 'embryo_transfer',
  result_day: 'pregnancy_test',
};

export function explainIvfStage(stage: IvfStage): IvfStageExplanation {
  return IVF_STAGE_EXPLANATIONS[stage];
}

export function explainTreatmentMilestone(milestone: TreatmentMilestoneKind): IvfStageExplanation {
  return explainIvfStage(TREATMENT_MILESTONE_STAGE[milestone]);
}

const KEYWORD_STAGE_RULES: Array<{ pattern: RegExp; stage: IvfStage }> = [
  { pattern: /피검|hcg|임신|베타/iu, stage: 'pregnancy_test' },
  { pattern: /이식|transfer/iu, stage: 'embryo_transfer' },
  { pattern: /배아|동결|배양|blast|포배/iu, stage: 'embryo_culture' },
  { pattern: /수정|정자|난자.*확인|fertiliz/iu, stage: 'fertilization' },
  { pattern: /채취|opu|retrieval/iu, stage: 'egg_retrieval' },
  { pattern: /주사|약|고날|오비드렐|퓨리곤|세트로|트리거|질정|프로게/iu, stage: 'ovarian_stimulation' },
  { pattern: /초진|검사|방문|예약|진료/iu, stage: 'baseline_testing' },
];

const INTENT_STAGE: Record<SelectedIntent, { stage: IvfStage; confidence: StageInferenceConfidence; reason: StageInferenceReason }> = {
  medication: { stage: 'ovarian_stimulation', confidence: 'high', reason: 'intent_match' },
  clinic_visit: { stage: 'baseline_testing', confidence: 'medium', reason: 'generic_clinic_visit' },
  procedure: { stage: 'egg_retrieval', confidence: 'high', reason: 'intent_match' },
  result_waiting: { stage: 'embryo_culture', confidence: 'medium', reason: 'ambiguous_result_waiting' },
  post_transfer: { stage: 'embryo_transfer', confidence: 'medium', reason: 'intent_match' },
  pregnancy_test: { stage: 'pregnancy_test', confidence: 'high', reason: 'intent_match' },
  unknown: { stage: 'baseline_testing', confidence: 'low', reason: 'unknown' },
};

export function inferStageFromCareItem(input: { selectedIntent: SelectedIntent; rawText?: string }): StageInference {
  const rawText = input.rawText?.trim() ?? '';
  const intent = INTENT_STAGE[input.selectedIntent] ?? INTENT_STAGE.unknown;
  const keywordStage = rawText ? KEYWORD_STAGE_RULES.find((rule) => rule.pattern.test(rawText))?.stage : undefined;

  if (!keywordStage) {
    return { inferredStage: intent.stage, confidence: intent.confidence, reason: intent.reason };
  }

  if (keywordStage === intent.stage) {
    return { inferredStage: intent.stage, confidence: 'high', reason: input.selectedIntent === 'unknown' ? 'keyword_match' : 'intent_match' };
  }

  if (input.selectedIntent === 'unknown') {
    return { inferredStage: keywordStage, confidence: 'medium', reason: 'keyword_match' };
  }

  if (input.selectedIntent === 'result_waiting') {
    return { inferredStage: intent.stage, confidence: 'medium', reason: 'ambiguous_result_waiting' };
  }

  return { inferredStage: intent.stage, confidence: intent.confidence === 'high' ? 'medium' : intent.confidence, reason: 'keyword_match' };
}

export function getEffectiveStage(inference: StageInference): IvfStage {
  return inference.userCorrectedStage ?? inference.inferredStage;
}

export function defaultSharingLevelByStage(stage: IvfStage): SharingLevel {
  switch (stage) {
    case 'pregnancy_test':
    case 'fertilization':
    case 'embryo_culture':
    case 'baseline_testing':
      return 'basic';
    case 'ovarian_stimulation':
    case 'egg_retrieval':
    case 'embryo_transfer':
      return 'care';
    default:
      return 'basic';
  }
}

export function formatStageLabel(stage: IvfStage) {
  const spec = IVF_STAGE_LABELS[stage];
  return `${spec.index}/7 ${spec.label}`;
}

export function buildUtilityPreview(stage: IvfStage, rawText?: string) {
  const main = rawText?.trim() || defaultMainCard(stage);
  const second = secondaryCard(stage);
  return {
    patientCards: [main, second],
    partnerCards: partnerCards(stage),
  };
}

function defaultMainCard(stage: IvfStage) {
  if (stage === 'ovarian_stimulation') return '약·주사 시간 확인';
  if (stage === 'egg_retrieval') return '채취 준비 일정 확인';
  if (stage === 'embryo_transfer') return '이식 후 안내 확인';
  if (stage === 'pregnancy_test') return '피검·결과 일정 확인';
  if (stage === 'embryo_culture') return '배아 결과 안내 확인';
  if (stage === 'fertilization') return '수정 준비 안내 확인';
  return '병원 안내 확인';
}

function secondaryCard(stage: IvfStage) {
  if (stage === 'ovarian_stimulation') return '주사 기록 · 증상 체크';
  if (stage === 'egg_retrieval') return '방문 준비물 확인';
  if (stage === 'embryo_transfer') return '복약·휴식 기록';
  if (stage === 'pregnancy_test') return '공유 범위 확인';
  return '다음 방문 메모';
}

function partnerCards(stage: IvfStage) {
  if (stage === 'ovarian_stimulation') return ['약 이름 확인', '준비물 체크'];
  if (stage === 'egg_retrieval') return ['이동 시간 확인', '회복 준비'];
  if (stage === 'embryo_transfer') return ['일정 같이 확인', '결과 질문 재촉하지 않기'];
  if (stage === 'pregnancy_test') return ['결과 수치 묻지 않기', '공유된 일정만 확인'];
  return ['일정 같이 확인', '필요한 준비물 챙기기'];
}


export function careDayForOnboardingStage(stage: IvfStage): OnboardingCareDay {
  switch (stage) {
    case 'ovarian_stimulation':
      return 'injection_day';
    case 'embryo_transfer':
      return 'two_week_wait_day';
    case 'pregnancy_test':
      return 'result_protection_day';
    case 'embryo_culture':
      return 'waiting_day';
    case 'baseline_testing':
    case 'egg_retrieval':
    case 'fertilization':
      return 'clinic_day';
    default:
      return 'clinic_day';
  }
}

export function buildInitialCareCycleState(input: {
  cycleId: string;
  inferredStage: IvfStage;
  effectiveStage: IvfStage;
  roleContext: InitialCareCycleState['roleContext'];
  sharingLevel: SharingLevel;
  partnerInvite: InitialCareCycleState['partnerInvite'];
  firstCareItem: InitialCareCycleState['firstCareItem'];
}): InitialCareCycleState {
  return {
    source: 'onboarding',
    version: 1,
    cycleId: input.cycleId,
    inferredStage: input.inferredStage,
    effectiveStage: input.effectiveStage,
    stageUserCorrected: input.effectiveStage !== input.inferredStage,
    careDay: careDayForOnboardingStage(input.effectiveStage),
    roleContext: input.roleContext,
    sharingLevel: input.sharingLevel,
    partnerInvite: input.partnerInvite,
    firstCareItem: input.firstCareItem,
  };
}
