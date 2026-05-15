import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('schedule-extract Edge Function image contract', () => {
  const source = () => readFileSync('supabase/functions/schedule-extract/index.ts', 'utf8');

  it('accepts image mode with imagePath and patientId and keeps CORS on JSON responses', () => {
    const code = source();

    expect(code).toContain("mode: 'image'");
    expect(code).toContain('imagePath: string');
    expect(code).toContain('patientId: string');
    expect(code).toContain('Access-Control-Allow-Origin');
    expect(code).toContain('Access-Control-Allow-Methods');
    expect(code).toContain("if (request.method === 'OPTIONS')");
    expect(code).toContain("headers: { ...corsHeaders, 'content-type': 'application/json' }");
  });

  it('uses the service role key to create a Supabase Storage signed URL before OpenRouter vision extraction', () => {
    const code = source();
    const signedUrlIndex = code.indexOf('async function createStorageSignedUrl');
    const openRouterIndex = code.indexOf('async function extractCandidatesFromImageWithOpenRouter');

    expect(code).toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    expect(code).toContain('/storage/v1/object/sign/');
    expect(code).toContain('authorization: `Bearer ${serviceRoleKey}`');
    expect(code).toContain("model: OPENROUTER_VISION_MODEL");
    expect(code).toContain("const OPENROUTER_VISION_MODEL = 'anthropic/claude-3-haiku-vision'");
    expect(code).toContain("type: 'image_url'");
    expect(signedUrlIndex).toBeGreaterThan(-1);
    expect(openRouterIndex).toBeGreaterThan(-1);
    expect(signedUrlIndex).toBeLessThan(openRouterIndex);
  });



  it('accepts text mode and uses non-vision Claude for raw text extraction', () => {
    const code = source();

    expect(code).toContain("| { mode: 'text'; rawText: string; patientId: string }");
    expect(code).toContain("if (body.mode === 'text')");
    expect(code).toContain('function normalizeTextRequest');
    expect(code).toContain('async function extractCandidatesFromTextWithOpenRouter');
    expect(code).toContain("const OPENROUTER_TEXT_MODEL = 'anthropic/claude-3-haiku'");
    expect(code).toContain('rawText,');
  });

  it('returns only the schedule candidates response shape and fails closed to an empty array for extraction failures', () => {
    const code = source();

    expect(code).toContain('type ScheduleExtractResponse = { candidates: ScheduleCandidate[] }');
    expect(code).toContain('type ScheduleCandidate = {');
    expect(code).toContain('scheduled_at: string | null');
    expect(code).toContain('dose: string | null');
    expect(code).toContain('unit: string | null');
    expect(code).toContain('if (!signedUrl) return json({ candidates: [] })');
    expect(code).toContain('if (!openRouterApiKey) return []');
    expect(code).toContain('if (!response?.ok) return []');
    expect(code).toContain('if (!isObjectWithCandidates(parsed)) return []');
  });

  it('explicitly forbids medical judgment and does not contain committed secrets', () => {
    const code = source();

    expect(code).toContain('의료 판단 금지, 일정 후보만 추출');
    expect(code).toContain('진단, 용량 판단, 치료 단계 판단, 복약/주사 권고를 하지 않는다');
    expect(code).not.toMatch(/sk-or-[A-Za-z0-9_-]+/u);
    expect(code).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]/u);
  });
});
