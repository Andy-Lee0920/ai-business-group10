import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOP_DOC = 'docs/03-engineering/vercel-preview-sop.md';
const PR_TEMPLATE = '.github/PULL_REQUEST_TEMPLATE.md';

describe('Vercel Preview SOP (#57)', () => {
  const sop = readFileSync(SOP_DOC, 'utf8');
  const template = readFileSync(PR_TEMPLATE, 'utf8');

  it('defines the preview evidence needed to close visual and route changes', () => {
    for (const required of [
      'Preview URL',
      'Commit SHA',
      'Mobile viewport',
      'Screenshot',
      'curl -I -L --max-time 20',
      'Root Directory "NudgeMe" does not exist',
    ]) {
      expect(sop).toContain(required);
    }
  });

  it('links the PR template to the SOP and keeps the minimum reviewer checks visible', () => {
    expect(template).toContain('docs/03-engineering/vercel-preview-sop.md');

    for (const required of [
      'URL loads with expected status/redirect',
      'Mobile viewport reviewed',
      'Changed path verified',
      'No secrets or private identifiers exposed',
    ]) {
      expect(template).toContain(required);
    }
  });
});
