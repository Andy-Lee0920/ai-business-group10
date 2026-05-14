import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('clinic-guide-ai smoke workflow', () => {
  it('provides a manual llm fallback verification path for the deployed Edge Function', () => {
    const workflow = readFileSync('.github/workflows/clinic-guide-ai-smoke.yml', 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('medication_input:');
    expect(workflow).toContain('expected_medication_id:');
    expect(workflow).toContain('OPENROUTER_API_KEY must be registered in Supabase secrets');
    expect(workflow).toContain('npm run verify:clinic-guide-ai');
    expect(workflow).toContain('--expect-source llm');
    expect(workflow).toContain('--expect-id');
    expect(workflow).toContain('NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}');
    expect(workflow).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}');
  });
});
