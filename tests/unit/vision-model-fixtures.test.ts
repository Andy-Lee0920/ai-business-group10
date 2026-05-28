import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface ExpectedFixture {
  samples: Array<{
    id: string;
    expected: Array<{
      type: 'injection' | 'medication' | 'clinic';
      title: string;
      scheduled_at: string | null;
      dose?: string | null;
      unit?: string | null;
    }>;
  }>;
}

const fixtureDir = 'tests/fixtures/vision-model';

describe('production-safe vision model comparison fixtures', () => {
  it('ships non-private image samples and expected candidates for #376 comparison', () => {
    const expectedPath = join(fixtureDir, 'expected-candidates.json');
    expect(existsSync(expectedPath)).toBe(true);

    const fixtures = JSON.parse(readFileSync(expectedPath, 'utf8')) as ExpectedFixture;
    expect(fixtures.samples.length).toBeGreaterThanOrEqual(2);

    for (const sample of fixtures.samples) {
      const imagePath = join(fixtureDir, `${sample.id}.png`);
      expect(existsSync(imagePath), imagePath).toBe(true);
      expect(readFileSync(imagePath).byteLength).toBeGreaterThan(2_000);
      expect(sample.expected.length).toBeGreaterThan(0);
      for (const candidate of sample.expected) {
        expect(['injection', 'medication', 'clinic']).toContain(candidate.type);
        expect(candidate.title.trim().length).toBeGreaterThan(0);
        expect(JSON.stringify(candidate)).not.toMatch(/환자|주민|전화|주소|등록번호|생년월일/u);
      }
    }
  });
});
