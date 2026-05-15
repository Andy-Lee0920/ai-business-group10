import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('clinic-guide-ai Edge Function contract', () => {
  it('keeps OpenRouter secret server-side and returns alias/llm/none medication normalization sources', () => {
    const source = readFileSync('supabase/functions/clinic-guide-ai/index.ts', 'utf8');

    expect(source).toContain('Access-Control-Allow-Origin');
    expect(source).toContain("Deno.env.get('OPENROUTER_API_KEY')");
    expect(source).toContain("const DEFAULT_OPENROUTER_CLINIC_GUIDE_MODEL = 'anthropic/claude-haiku-4.5'");
    expect(source).toContain("Deno.env.get('OPENROUTER_CLINIC_GUIDE_MODEL')");
    expect(source).toContain('model: OPENROUTER_CLINIC_GUIDE_MODEL');
    expect(source).toContain("mode: 'interview'");
    expect(source).toContain('userInput: string');
    expect(source).toContain('patientId: string');
    expect(source).toContain("source: 'aliases'");
    expect(source).toContain("source: 'llm'");
    expect(source).toContain("source: 'none'");
    expect(source).toContain('requiresUserConfirmation: true');
    expect(source).toContain('Do not provide medical advice');
    expect(source).not.toMatch(/sk-or-[A-Za-z0-9_-]+/u);
  });

  it('returns alias matches before the OpenRouter fallback can run', () => {
    const source = readFileSync('supabase/functions/clinic-guide-ai/index.ts', 'utf8');
    const aliasReturnIndex = source.indexOf("if (aliasMatch) return json({ matched: aliasMatch, source: 'aliases' })");
    const llmFallbackIndex = source.indexOf('const llmMatch = await matchMedicationWithOpenRouter');

    expect(aliasReturnIndex).toBeGreaterThan(-1);
    expect(llmFallbackIndex).toBeGreaterThan(-1);
    expect(aliasReturnIndex).toBeLessThan(llmFallbackIndex);
  });

  it('supports partial substring alias matching for short Korean medication input', () => {
    const source = readFileSync('supabase/functions/clinic-guide-ai/index.ts', 'utf8');

    expect(source).toContain('candidate.includes(normalizedInput)');
  });

  it('keeps interview mode adaptive and fallback-safe', () => {
    const source = readFileSync('supabase/functions/clinic-guide-ai/index.ts', 'utf8');

    expect(source).toContain('return handleInterview');
    expect(source).toContain('buildInterviewFallback');
    expect(source).toContain('resolveNextStep');
    expect(source).toContain('fallbackReason');
  });

});
