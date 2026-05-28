const BLOCKED_PATTERNS = [
  /진단/u,
  /용량.*(조절|늘리|줄이|변경)/u,
  /(복용|투약|주사).*(늘리|줄이|중단|변경)/u,
  /(임신|착상).*(성공|실패|예측|확률)/u,
  /(괜찮|정상|위험).*(판단|확정)/u,
  /prognosis|diagnos|dosage|pregnancy chance/iu,
] as const;

export function isBriefSafe(text: string) {
  const normalized = text.trim();
  return normalized.length > 0 && !BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function fallbackLine(facts: readonly { fact: string }[]) {
  return facts.map((fact) => fact.fact).filter(Boolean).join(' ');
}
