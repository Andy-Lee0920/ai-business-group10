import { describe, expect, it } from 'vitest';
import { manualAddConfigFor } from '../../src/domain/slc-manual-add';

describe('SLC manual add type-specific form contract', () => {
  it('removes ambiguous shared naming and gives clinic a visit-purpose field', () => {
    expect(manualAddConfigFor('clinic')).toMatchObject({
      titleLabel: '방문 목적',
      titlePlaceholder: '난포 확인 / 피검사 / 진료',
      showMedicationSelect: false,
      showDose: false,
    });
    expect(manualAddConfigFor('injection').titleLabel).toBe('주사 이름');
    expect(manualAddConfigFor('medication').titleLabel).toBe('복용약 이름');
    expect(JSON.stringify([
      manualAddConfigFor('clinic'),
      manualAddConfigFor('injection'),
      manualAddConfigFor('medication'),
    ])).not.toContain('약명 또는 일정명');
  });
});
