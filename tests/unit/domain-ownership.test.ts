import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('domain ownership audit', () => {
  it('keeps real partner role projection connected to API and service surfaces', () => {
    expect(read('src/services/partner-view.ts')).toContain(
      "from '../domain/partner-role-projection'",
    );
    expect(read('app/api/partner/[token]/cards/route.ts')).toContain(
      "from '../../../../../src/domain/partner-role-projection'",
    );
  });

  it('keeps demo partner projection separate from real care-card projection', () => {
    const demoState = read('app/demo/demo-state.ts');

    expect(demoState).toContain('requiresSharingLevel');
    expect(demoState).toContain('partner-redflag-watch');
    expect(demoState).not.toContain('partner-role-projection');
  });

  it('keeps 2WW and result protection domains connected to adaptive home surfaces', () => {
    expect(read('src/features/adaptive-home/two-week-wait-home.tsx')).toContain(
      "from '../../domain/two-week-wait'",
    );
    expect(read('src/features/adaptive-home/result-protection-home.tsx')).toContain(
      "from '../../domain/result-protection'",
    );
  });

  it('keeps SLC Today ownership separated from deprecated Care OS architecture', () => {
    const home = read('app/(authed)/home/page.tsx');
    const onboarding = read('app/api/onboarding/route.ts');

    expect(home).toContain('TodayScreen');
    expect(home).toContain('schedule_items');
    expect(home).not.toContain('care-os-architecture');
    expect(onboarding).toContain('user_consents');
    expect(onboarding).toContain('getSeedItems');
  });
});
