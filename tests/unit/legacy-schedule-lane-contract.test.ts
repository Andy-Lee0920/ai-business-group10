import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const photoAnalyzeRoute = 'app/api/onboard/photo-analyze/route.ts';
const textAnalyzeRoute = 'app/api/onboard/text-analyze/route.ts';
const confirmRoute = 'app/api/onboard/candidates/confirm/route.ts';

describe('legacy schedule lane guard', () => {
  it('keeps onboard AI/OCR candidate creation on split_candidates, not legacy schedule lanes', () => {
    for (const route of [photoAnalyzeRoute, textAnalyzeRoute]) {
      const source = readFileSync(route, 'utf8');
      expect(source).toContain("from('split_candidates')");
      expect(source).not.toContain("from('schedule_candidates')");
      expect(source).not.toContain("from('schedule_items')");
    }
  });

  it('keeps onboard candidate confirmation on care_action_cards, not schedule_items', () => {
    const source = readFileSync(confirmRoute, 'utf8');
    expect(source).toContain("from('split_candidates')");
    expect(source).toContain('createConfirmedCareActions');
    expect(source).not.toContain("from('schedule_items')");
  });
});
