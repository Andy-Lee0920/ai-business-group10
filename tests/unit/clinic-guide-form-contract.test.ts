import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('ClinicUpdateForm Clinic Guide integration', () => {
  it('uses the shared Clinic Guide types and displays normalized medication candidate cards', () => {
    const source = readFileSync('src/features/clinic-update/clinic-update-form.tsx', 'utf8');

    expect(source).toContain("ClinicGuideMedicationNormalizeResponse");
    expect(source).toContain("/api/clinic-guide/normalize");
    expect(source).toContain('정규화된 약 후보');
    expect(source).toContain('resolveMedicationNames');
    expect(source).not.toContain('form.addedMedicationIds.join');
  });
});
