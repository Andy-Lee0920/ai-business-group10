import { describe, expect, it } from 'vitest';
import { buildManualAddPayload, manualAddConfigFor } from '../../src/domain/slc-manual-add';

describe('SLC manual add type-specific form contract', () => {
  it('removes ambiguous shared naming and gives clinic a visit-purpose field', () => {
    expect(manualAddConfigFor('clinic')).toMatchObject({
      titleLabel: '방문 목적',
      titlePlaceholder: '난포 확인 / 피검사 / 진료',
      showMedicationSelect: false,
      showDose: false,
    });
    expect(manualAddConfigFor('injection').titleLabel).toBe('주사제 선택 또는 직접 입력');
    expect(manualAddConfigFor('medication').titleLabel).toBe('복용약 선택 또는 직접 입력');
    expect(JSON.stringify([
      manualAddConfigFor('clinic'),
      manualAddConfigFor('injection'),
      manualAddConfigFor('medication'),
    ])).not.toContain('약명 또는 일정명');
  });

  it('uses type-specific unit options and clears hidden medication fields for clinic visits', () => {
    expect(manualAddConfigFor('injection').unitOptions).toEqual(['IU', 'μg', 'mg', 'ml', 'syringe']);
    expect(manualAddConfigFor('medication').unitOptions).toEqual(['정', '개', 'mg', 'ml']);
    expect(manualAddConfigFor('clinic').unitOptions).toEqual([]);

    expect(buildManualAddPayload({
      type: 'clinic',
      title: '난포 확인',
      dose: '150',
      unit: 'IU',
      scheduledAt: '2026-05-14T09:00:00.000Z',
      medicationId: 'gonal-f',
    })).toMatchObject({
      type: 'clinic',
      title: '난포 확인',
      dose: null,
      unit: null,
      medicationId: null,
    });
  });
});
