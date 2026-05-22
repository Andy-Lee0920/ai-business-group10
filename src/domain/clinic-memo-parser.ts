import type { IvfStage, StageInferenceConfidence } from './onboarding-care-state';

export type ExtractedClinicMemoToken = {
  label: string;
  value: string;
};

export type ParsedClinicMemo = {
  sourceText: string;
  sourceSummary: string;
  extractedTokens: ExtractedClinicMemoToken[];
  inferredStage: IvfStage;
  confidence: StageInferenceConfidence;
  partnerRoleHints: string[];
  fallbackReason: string | null;
};

type StageRule = {
  stage: IvfStage;
  confidence: StageInferenceConfidence;
  patterns: RegExp[];
  partnerHints: string[];
};

const STAGE_RULES: StageRule[] = [
  {
    stage: 'embryo_transfer',
    confidence: 'high',
    patterns: [/이식/iu, /프로게스테론/iu, /질정/iu],
    partnerHints: ['약 시간과 쉬는 시간을 조용히 확인'],
  },
  {
    stage: 'embryo_culture',
    confidence: 'high',
    patterns: [/배아/iu, /수정/iu, /동결/iu, /등급/iu, /Day\s*[35]/iu],
    partnerHints: ['결과 세부를 먼저 묻지 않고 다음 연락만 확인'],
  },
  {
    stage: 'pregnancy_test',
    confidence: 'high',
    patterns: [/피검/iu, /h\s*c\s*g/iu, /임신\s*확인/iu, /결과\s*전화/iu],
    partnerHints: ['결과를 재촉하지 않고 공유된 일정만 확인'],
  },
  {
    stage: 'egg_retrieval',
    confidence: 'high',
    patterns: [/채취/iu, /마취/iu, /수술/iu, /금식/iu],
    partnerHints: ['이동과 회복 준비를 먼저 확인'],
  },
  {
    stage: 'ovarian_stimulation',
    confidence: 'high',
    patterns: [/주사/iu, /고날(?:에프)?/iu, /오비드렐/iu, /퓨리곤/iu, /세트로(?:타이드)?/iu],
    partnerHints: ['주사 30분 전 준비물 확인'],
  },
  {
    stage: 'baseline_testing',
    confidence: 'medium',
    patterns: [/초음파/iu, /채혈/iu, /내원/iu],
    partnerHints: ['방문 시간과 질문 목록을 함께 확인'],
  },
];

const GENERAL_CLINIC_PATTERNS = [/병원/iu, /안내/iu, /예약/iu, /진료/iu, /확인/iu];

export function parseClinicMemo(input: string): ParsedClinicMemo {
  const sourceText = normalizeInput(input);
  const stageRule = findStageRule(sourceText);
  const hasGeneralClinicSignal = GENERAL_CLINIC_PATTERNS.some((pattern) => pattern.test(sourceText));
  const inferredStage = stageRule?.stage ?? 'baseline_testing';
  const confidence: StageInferenceConfidence = stageRule?.confidence ?? (hasGeneralClinicSignal ? 'medium' : 'low');
  const fallbackReason = stageRule
    ? null
    : hasGeneralClinicSignal
      ? '병원 방문 안내를 기준으로 케어 메모를 만들었어요.'
      : '안내받은 내용을 먼저 케어 메모로 정리했어요.';

  const extractedTokens = buildExtractedTokens(sourceText, inferredStage, stageRule?.partnerHints ?? []);
  return {
    sourceText,
    sourceSummary: summarizeSource(sourceText),
    extractedTokens,
    inferredStage,
    confidence,
    partnerRoleHints: stageRule?.partnerHints ?? defaultPartnerHints(inferredStage),
    fallbackReason,
  };
}

function normalizeInput(input: string) {
  return input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function findStageRule(sourceText: string) {
  return STAGE_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(sourceText)));
}

function buildExtractedTokens(sourceText: string, stage: IvfStage, partnerHints: string[]): ExtractedClinicMemoToken[] {
  const tokens: ExtractedClinicMemoToken[] = [];
  const medication = extractMedication(sourceText);
  const time = extractTime(sourceText);
  const clinicVisit = extractClinicVisit(sourceText);
  const partnerRole = extractPartnerRole(sourceText) ?? partnerHints[0];

  if (medication) tokens.push({ label: '약·주사', value: medication });
  if (time) tokens.push({ label: '시간', value: time });
  if (clinicVisit) tokens.push({ label: '병원 방문', value: clinicVisit });
  if (partnerRole) tokens.push({ label: '파트너 역할', value: partnerRole });

  if (tokens.length === 0) tokens.push({ label: '병원 안내', value: defaultTokenValue(stage) });
  return dedupeTokens(tokens);
}

function extractMedication(sourceText: string) {
  const line = sourceText.split('\n').find((item) => /고날|오비드렐|퓨리곤|세트로|주사|프로게스테론|질정/iu.test(item));
  if (!line) return null;
  const drug = line.match(/(고날(?:에프)?|오비드렐|퓨리곤|세트로(?:타이드)?|프로게스테론|질정)/iu)?.[0];
  const dose = line.match(/\d+(?:\.\d+)?\s*(?:IU|iu|mg|mcg|mL|ml|정)/u)?.[0];
  if (drug && dose) return `${normalizeDrugName(drug)} ${dose.replace(/iu/u, 'IU')}`;
  if (drug) return normalizeDrugName(drug);
  const injectionLine = line.match(/[^\n]*(?:주사|약)[^\n]*/iu)?.[0]?.trim();
  return injectionLine ?? null;
}

function extractTime(sourceText: string) {
  const match = sourceText.match(/(?:(오늘|내일)\s*)?(?:(오전|오후|밤|저녁|아침)\s*)?(\d{1,2})(?::(\d{2}))?\s*시/u);
  if (!match) return null;
  const [, day, meridiem, hour, minute] = match;
  return [day, meridiem, `${hour}${minute ? `:${minute}` : ''}시`].filter(Boolean).join(' ');
}

function extractClinicVisit(sourceText: string) {
  const line = sourceText.split('\n').find((item) => /초음파|채혈|내원|방문|병원/iu.test(item));
  if (!line) return null;
  return line.length > 34 ? `${line.slice(0, 33)}…` : line;
}

function extractPartnerRole(sourceText: string) {
  const line = sourceText.split('\n').find((item) => /파트너|아내|배우자/iu.test(item));
  if (!line) return null;
  const cleaned = line
    .replace(/^(파트너|아내|배우자)(은|는)?\s*/u, '')
    .replace(/^함께\s*/u, '')
    .replace(/전에/u, '전')
    .trim();
  return cleaned || null;
}

function normalizeDrugName(value: string) {
  if (/고날/iu.test(value)) return '고날에프';
  if (/세트로/iu.test(value)) return '세트로타이드';
  return value;
}

function summarizeSource(sourceText: string) {
  if (!sourceText) return '병원 안내 메모';
  const oneLine = sourceText.replace(/\n+/g, ' · ');
  return oneLine.length > 72 ? `${oneLine.slice(0, 71)}…` : oneLine;
}

function defaultPartnerHints(stage: IvfStage) {
  if (stage === 'ovarian_stimulation') return ['주사 30분 전 준비물 확인'];
  if (stage === 'egg_retrieval') return ['이동과 회복 준비를 먼저 확인'];
  if (stage === 'embryo_transfer') return ['약 시간과 쉬는 시간을 조용히 확인'];
  if (stage === 'pregnancy_test') return ['결과를 재촉하지 않고 공유된 일정만 확인'];
  if (stage === 'embryo_culture') return ['결과 세부를 먼저 묻지 않고 다음 연락만 확인'];
  return ['방문 시간과 질문 목록을 함께 확인'];
}

function defaultTokenValue(stage: IvfStage) {
  if (stage === 'ovarian_stimulation') return '약·주사 안내';
  if (stage === 'egg_retrieval') return '채취 전후 안내';
  if (stage === 'embryo_culture') return '결과 연락 대기';
  if (stage === 'embryo_transfer') return '이식 후 관리';
  if (stage === 'pregnancy_test') return '피검·결과 일정';
  return '방문·검사 일정';
}

function dedupeTokens(tokens: ExtractedClinicMemoToken[]) {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    const key = `${token.label}:${token.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
