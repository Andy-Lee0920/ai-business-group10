import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const confirmSheet = readFileSync('src/components/confirm-sheet.tsx', 'utf8');
const todayScreen = readFileSync('src/features/today/today-screen.tsx', 'utf8');
const recordsDomain = readFileSync('src/domain/slc-records.ts', 'utf8');

describe('SLC Home to Records confirm loop contract', () => {
  it('uses the abdomen PNG with four invisible immediate-complete zones and no extra injection complete button', () => {
    expect(confirmSheet).toContain('/assets/slc/abdomen-front.png');
    expect(confirmSheet).toContain("site: 'upper_left'");
    expect(confirmSheet).toContain("site: 'upper_right'");
    expect(confirmSheet).toContain("site: 'lower_left'");
    expect(confirmSheet).toContain("site: 'lower_right'");
    expect(confirmSheet).toContain('onClick={() => onComplete(site)}');
    expect(confirmSheet).not.toContain('주사 완료</button>');
  });

  it('posts the selected injection site, marks home completed, and records Korean site labels', () => {
    expect(todayScreen).toContain('/api/schedule/complete');
    expect(todayScreen).toContain('injectionSite: site');
    expect(todayScreen).toContain("status: 'completed'");
    expect(recordsDomain).toContain("lower_right: '오른쪽 아래'");
  });
});
