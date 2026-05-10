import {
  DESCRIPTION_FORBIDDEN_CATEGORIES,
  type DescriptionValidationResult,
  type ForbiddenPhraseCategory,
  type ForbiddenPhraseHit,
} from '../types/description-guard.types';

export { DESCRIPTION_FORBIDDEN_CATEGORIES };

type PatternRule = {
  phrase: string;
  category: ForbiddenPhraseCategory;
  pattern: RegExp;
};

const RULES: readonly PatternRule[] = [
  rule('용량 조정', 'dosage_change', /용량\s*(?:을\s*)?(?:올리|내리|늘리|줄이|증량|감량)[가-힣\s]*(?:세요|십시오|하기|해요)?/giu),
  rule('증량/감량', 'dosage_change', /(?:증량|감량|용량\s*변경|용량\s*조절)/giu),
  rule('mg 변경', 'dosage_change', /\d+(?:\.\d+)?\s*(?:mg|iu|단위)\s*(?:로|까지)?\s*(?:올려|내려|늘려|줄여|증량|감량)/giu),
  rule('투약 중단', 'dosage_change', /(?:약|주사|투약|복용)\s*(?:을\s*)?(?:중단|끊어|빼도|맞지\s*않아도)/giu),
  rule('배수 변경', 'dosage_change', /(?:두\s*배|반으로|절반으로)\s*(?:늘려|줄여|감량|증량)/giu),
  rule('진단 의심', 'diagnosis', /(?:PCOS|다낭성|자궁내막증|난소기능저하|착상\s*실패)[가-힣\s]*(?:의심|같아요|입니다|진단)/giu),
  rule('증상 판단', 'diagnosis', /(?:이\s*)?증상(?:은|이)?\s*(?:정상|비정상|위험|문제없)/giu),
  rule('병명 추론', 'diagnosis', /(?:병|질환|염증|감염)\s*(?:인\s*)?것\s*같/giu),
  rule('성공률 단정', 'success_rate', /(?:성공률|성공\s*가능성|임신\s*가능성|확률)\s*(?:이\s*)?(?:높|낮|좋|나쁘|\d+\s*%)/giu),
  rule('성공 예측', 'success_rate', /(?:이번엔|이번에는)?\s*(?:성공|임신|착상)(?:될|할)\s*(?:거예요|겁니다|가능성이)/giu),
  rule('결과 단정', 'success_rate', /(?:잘\s*될\s*거예요|착상\s*잘|임신\s*확정)/giu),
  rule('방문 생략', 'treatment_strategy', /병원(?:에)?\s*(?:가지\s*않아도|안\s*가도|방문\s*취소)/giu),
  rule('전략 변경', 'treatment_strategy', /(?:프로토콜|치료\s*방향|치료\s*전략)\s*(?:변경|바꾸|수정)/giu),
  rule('시술 일정 변경', 'treatment_strategy', /(?:이식|채취|시술)\s*(?:취소|미루|당기|연기)/giu),
  rule('처방 대체', 'treatment_strategy', /(?:처방|약|주사)\s*(?:을\s*)?(?:대체|바꿔도|바꾸세요)/giu),
];

function rule(phrase: string, category: ForbiddenPhraseCategory, pattern: RegExp): PatternRule {
  return { phrase, category, pattern };
}

export function detectForbiddenPhrases(text: string | null | undefined): ForbiddenPhraseHit[] {
  if (!text?.trim()) return [];

  const hits = RULES.flatMap((ruleItem) => findRuleHits(text, ruleItem));
  return dedupeHits(hits).sort((left, right) => left.offset - right.offset || left.category.localeCompare(right.category));
}

export function validateDescription(text: string | null | undefined): DescriptionValidationResult {
  const warnings = detectForbiddenPhrases(text);
  return { ok: warnings.length === 0, warnings };
}

function findRuleHits(text: string, ruleItem: PatternRule): ForbiddenPhraseHit[] {
  return Array.from(text.matchAll(ruleItem.pattern), (match) => ({
    phrase: ruleItem.phrase,
    category: ruleItem.category,
    matched: match[0],
    offset: match.index ?? 0,
  }));
}

function dedupeHits(hits: readonly ForbiddenPhraseHit[]): ForbiddenPhraseHit[] {
  const accepted: ForbiddenPhraseHit[] = [];
  const ordered = [...hits].sort((left, right) => left.offset - right.offset || right.matched.length - left.matched.length);

  for (const hit of ordered) {
    const end = hit.offset + hit.matched.length;
    const overlaps = accepted.some(
      (acceptedHit) => acceptedHit.category === hit.category && rangesOverlap(hit.offset, end, acceptedHit.offset, acceptedHit.offset + acceptedHit.matched.length),
    );
    if (!overlaps) accepted.push(hit);
  }

  return accepted;
}

function rangesOverlap(leftStart: number, leftEnd: number, rightStart: number, rightEnd: number) {
  return leftStart < rightEnd && rightStart < leftEnd;
}
