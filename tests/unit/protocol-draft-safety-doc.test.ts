import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('protocol draft safety contract (#51/#96)', () => {
  it('documents confirm-only boundaries and BYOK fallback relation', () => {
    const doc = readFileSync('docs/03-engineering/protocol-draft-safety.md', 'utf8');
    expect(doc).toContain('draft-only');
    expect(doc).toContain('must not call `confirm_capture`');
    expect(doc).toContain('OpenRouter');
    expect(doc).toContain('manual fallback');
    expect(doc).toContain('No dosage inference');
    expect(doc).toContain('No automatic calendar/home card creation');
  });
});
