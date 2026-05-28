import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeLoader = readFileSync('src/features/today/home-page-loader.tsx', 'utf8');

describe('/home canonical reader contract', () => {
  it('reads care_action_cards as the primary source before legacy schedule_items fallback', () => {
    const careIndex = homeLoader.indexOf("from('care_action_cards')");
    const legacyIndex = homeLoader.indexOf("from('schedule_items')");

    expect(careIndex).toBeGreaterThanOrEqual(0);
    expect(legacyIndex).toBeGreaterThanOrEqual(0);
    expect(careIndex).toBeLessThan(legacyIndex);
    expect(homeLoader).toContain('projectCareActionCardsForHome');
  });

  it('lets canonical care_action_cards satisfy the authed layout existing-care guard', () => {
    const layout = readFileSync('app/(authed)/layout.tsx', 'utf8');

    expect(layout).toContain("from('care_action_cards')");
    expect(layout).toContain('existingCareCardResult');
    expect(layout).toContain('Boolean(existingScheduleResult.data) || Boolean(existingCareCardResult.data)');
  });

});
