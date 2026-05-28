type ExtractedScheduleCandidate = {
  title: string;
  dose?: string | null;
  unit?: string | null;
};

const MEDICAL_ADVICE_PATTERNS = [
  /용량\s*(?:을\s*)?(?:늘리|줄이|조절|변경)/u,
  /복용\s*(?:을\s*)?(?:중단|늘리|줄이|조절|변경)/u,
  /투약\s*(?:을\s*)?(?:중단|늘리|줄이|조절|변경)/u,
  /주사\s*(?:를\s*)?(?:중단|늘리|줄이|조절|변경)/u,
  /처방\s*(?:을\s*)?(?:변경|중단)/u,
  /치료\s*(?:권고|추천|변경)/u,
  /진단/u,
] as const;

export function filterMedicalAdviceCandidates<T extends ExtractedScheduleCandidate>(candidates: T[]): T[] {
  return candidates.filter((candidate) => !containsMedicalAdvice(candidate));
}

function containsMedicalAdvice(candidate: ExtractedScheduleCandidate) {
  const text = [candidate.title, candidate.dose, candidate.unit].filter(Boolean).join(' ');
  return MEDICAL_ADVICE_PATTERNS.some((pattern) => pattern.test(text));
}
