import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homePage = readFileSync('app/(authed)/home/page.tsx', 'utf8');

describe('/home canonical reader contract', () => {
  it('reads care_action_cards as the primary source before legacy schedule_items fallback', () => {
    const careIndex = homePage.indexOf("from('care_action_cards')");
    const legacyIndex = homePage.indexOf("from('schedule_items')");

    expect(careIndex).toBeGreaterThanOrEqual(0);
    expect(legacyIndex).toBeGreaterThanOrEqual(0);
    expect(careIndex).toBeLessThan(legacyIndex);
    expect(homePage).toContain('projectCareActionCardsForHome');
  });
});
