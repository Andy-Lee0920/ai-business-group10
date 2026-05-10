export const DESCRIPTION_FORBIDDEN_CATEGORIES = [
  'dosage_change',
  'diagnosis',
  'success_rate',
  'treatment_strategy',
] as const;

export type ForbiddenPhraseCategory = (typeof DESCRIPTION_FORBIDDEN_CATEGORIES)[number];

export type ForbiddenPhraseHit = {
  phrase: string;
  category: ForbiddenPhraseCategory;
  matched: string;
  offset: number;
};

export type DescriptionValidationResult = {
  ok: boolean;
  warnings: ForbiddenPhraseHit[];
};
