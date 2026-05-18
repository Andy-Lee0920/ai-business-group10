import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scheduleExtract = readFileSync('supabase/functions/schedule-extract/index.ts', 'utf8');

describe('Vision model selection contract', () => {
  it('keeps OpenRouter as the provider and model choice as an environment override', () => {
    expect(scheduleExtract).toContain('https://openrouter.ai/api/v1/chat/completions');
    expect(scheduleExtract).toContain("const DEFAULT_OPENROUTER_SCHEDULE_MODEL = 'anthropic/claude-haiku-4.5'");
    expect(scheduleExtract).toContain("Deno.env.get('OPENROUTER_VISION_MODEL')");
    expect(scheduleExtract).toContain('model: OPENROUTER_VISION_MODEL');
  });

  it('documents a deterministic comparison gate before switching to Gemini', () => {
    const doc = readFileSync('docs/03-engineering/vision-model-evaluation.md', 'utf8');
    expect(doc).toContain('OpenRouter remains the provider');
    expect(doc).toContain('google/gemini-3-flash-preview');
    expect(doc).toContain('Do not change env from preference alone');
    expect(doc).toContain('same image sample');
    expect(doc).toContain('time');
    expect(doc).toContain('medication name');
    expect(doc).toContain('card type');
    expect(doc).toContain('injection site');
    expect(doc).toContain('manual path remains available');
  });
});
