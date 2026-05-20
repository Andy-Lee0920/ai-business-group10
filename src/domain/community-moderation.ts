export interface ModerationFilterRule {
  ruleType: 'keyword' | 'regex';
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
    .filter((rule) => rule.active && ruleMatches(body, rule))
    .map((rule) => rule.pattern);

  return { status: matchedPatterns.length ? 'pending' : 'approved', matchedPatterns };
}

function ruleMatches(body: string, rule: ModerationFilterRule): boolean {
  if (rule.ruleType === 'keyword') return body.includes(rule.pattern);
  try {
    return new RegExp(rule.pattern, 'iu').test(body);
  } catch {
    return false;
  }
}
