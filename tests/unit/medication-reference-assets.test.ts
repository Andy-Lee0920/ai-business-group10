import { describe, expect, it } from 'vitest';
import { resolveMedicationReferenceAsset } from '../../src/domain/medication-reference-assets';

describe('medication reference assets', () => {
  it('uses deterministic exact registry keys and known normalized titles only', () => {
    expect(resolveMedicationReferenceAsset({ medicationId: 'ovidrel', title: null })).toMatchObject({ normalizedKey: 'ovidrel', assetPath: '/assets/medications/ovidrel.svg' });
    expect(resolveMedicationReferenceAsset({ medicationId: null, title: '오늘 21:00 고날에프 150 IU 주사' })).toMatchObject({ normalizedKey: 'gonal-f' });
    expect(resolveMedicationReferenceAsset({ medicationId: null, title: '세트로타이드 주사' })).toMatchObject({ normalizedKey: 'cetrotide' });
    expect(resolveMedicationReferenceAsset({ medicationId: null, title: '메노푸어 75 IU' })).toMatchObject({ normalizedKey: 'menopur' });
    expect(resolveMedicationReferenceAsset({ medicationId: null, title: '오비트렐 250 주사' })).toMatchObject({ normalizedKey: 'ovidrel' });
    expect(resolveMedicationReferenceAsset({ medicationId: 'cetro', title: null })).toMatchObject({ normalizedKey: 'cetrotide' });
  });

  it('returns no image for unmapped free text instead of guessing or using a generic fallback', () => {
    expect(resolveMedicationReferenceAsset({ medicationId: null, title: '하얀색 주사약' })).toBeNull();
    expect(resolveMedicationReferenceAsset({ medicationId: 'unknown-drug', title: '처방전 사진' })).toBeNull();
  });
});
