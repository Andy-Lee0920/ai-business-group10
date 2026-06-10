import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Care Agent acceptance gate doc', () => {
  const doc = () => readFileSync('docs/01-product/care-agent-acceptance-gate.md', 'utf8');

  it('keeps concern-triage deferred until a bounded implementation issue is accepted', () => {
    const gate = doc();

    expect(gate).toContain('Status: Deferred');
    expect(gate).toContain('Do not implement the Care Agent / concern-triage WIP before the 2026-06-20 presentation');
    expect(gate).toContain('keep ADR 0032 Proposed');
    expect(gate).toContain('Code, migrations, and bottom-navigation changes remain out of scope for this gate');
  });

  it('locks the safety and persistence invariants for any future implementation', () => {
    const gate = doc();

    for (const invariant of [
      'No medical advice generation',
      'Deterministic classifier before any AI involvement',
      'No raw utterance, raw clinical text, model response body, or generated advice persisted',
      'primary-private',
      'Partner views must not expose concern signals or clinic questions',
      'Existing direct routes (`/add`, `/clinic-update`) must remain reachable',
    ]) {
      expect(gate).toContain(invariant);
    }
  });
});
