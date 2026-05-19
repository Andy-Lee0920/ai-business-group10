import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/smoke-production-schedule-extract-fixtures.mjs';

describe('production schedule-extract fixture smoke script', () => {
  it('uses synthetic fixtures and avoids printing secret values', () => {
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('clinic-note-ovidrel.png');
    expect(script).toContain('clinic-note-mixed.png');
    expect(script).toContain('expected-candidates.json');
    expect(script).toContain('/functions/v1/schedule-extract');
    expect(script).toContain('scoreVisionModelRuns');
    expect(script).toContain('production default');
    expect(script).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(script).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(script).not.toMatch(/console\.log\([^)]*SUPABASE.*KEY|console\.log\([^)]*apikey/u);
    expect(script).toContain('results.push({ sample: sampleId, status: response.status, ok: response.ok, candidates });')
  });
});
