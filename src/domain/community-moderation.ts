export interface ModerationFilterRule {
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  active: boolean;
}

export interface ModerationFilterResult {
  status: 'pending' | 'approved';
  matchedPatterns: string[];
}

export function runDeterministicModerationFilter(body: string, rules: ModerationFilterRule[]): ModerationFilterResult {
  const matchedPatterns = rules
    .filter((rule) => rule.active && body.includes(rule.pattern))
    .map((rule) => rule.pattern);

  return { status: matchedPatterns.length ? 'pending' : 'approved', matchedPatterns };
}
