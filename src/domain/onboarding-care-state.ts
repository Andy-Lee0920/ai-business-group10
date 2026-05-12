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
