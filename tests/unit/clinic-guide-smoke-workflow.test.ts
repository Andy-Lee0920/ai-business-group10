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

  it('keeps an optional PR CI fallback smoke step available before merge', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

    expect(workflow).toContain('Clinic Guide AI LLM fallback smoke (optional)');
    expect(workflow).toContain('CLINIC_GUIDE_AI_SMOKE_INPUT');
    expect(workflow).toContain('CLINIC_GUIDE_AI_EXPECTED_ID');
    expect(workflow).toContain('npm run verify:clinic-guide-ai');
    expect(workflow).toContain('--expect-source llm');
    expect(workflow).toContain('--expect-id');
  });

  it('allows the existing CI workflow to dispatch a fallback smoke with explicit inputs', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('clinic_guide_ai_smoke_input:');
    expect(workflow).toContain('clinic_guide_ai_expected_id:');
    expect(workflow).toContain('${{ github.event.inputs.clinic_guide_ai_smoke_input || vars.CLINIC_GUIDE_AI_SMOKE_INPUT }}');
    expect(workflow).toContain('${{ github.event.inputs.clinic_guide_ai_expected_id || vars.CLINIC_GUIDE_AI_EXPECTED_ID }}');
  });

});
