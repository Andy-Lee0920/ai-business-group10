import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DECISION_DOC = 'docs/04-decisions/0005-input-mode-decision.md';

describe('input mode decision (#97)', () => {
  const doc = readFileSync(DECISION_DOC, 'utf8');

  it('compares all three candidate input modes and picks a primary/fallback for each v1 path', () => {
    expect(doc).toContain('Quick structured entry');
    expect(doc).toContain('Capture-first entry');
    expect(doc).toContain('Template-first entry');

    for (const path of [
      'Schedule add/change',
      'Medication/injection',
      'IVF treatment records',
      'Emotion check-in',
      'Onboarding first setup',
    ]) {
      expect(doc).toContain(path);
    }

    expect(doc).toMatch(/Schedule add\/change\s*\|\s*Quick structured entry\s*\|\s*Capture-first entry/u);
    expect(doc).toMatch(/Medication\/injection\s*\|\s*Quick structured entry\s*\|\s*Capture-first entry/u);
    expect(doc).toMatch(/IVF treatment records\s*\|\s*Capture-first entry\s*\|\s*Template-first entry/u);
    expect(doc).toMatch(/Emotion check-in\s*\|\s*Quick structured entry\s*\|\s*Capture-first entry/u);
    expect(doc).toMatch(/Onboarding first setup\s*\|\s*Quick structured entry\s*\|\s*Capture-first entry/u);
  });

  it('states the low-burden rule and the never-auto-confirm boundary', () => {
    expect(doc).toContain('one-screen');
    expect(doc).toContain('never auto-confirm');
    expect(doc).toContain('Medication names, doses, injection timing, ownership, and partner visibility');
  });
});
