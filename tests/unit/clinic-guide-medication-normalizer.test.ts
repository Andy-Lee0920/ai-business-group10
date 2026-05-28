import { describe, expect, it } from 'vitest';
import { findMedicationAliasMatch, resolveMedicationNames } from '../../src/domain/clinic-guide-medication-normalizer';

const medications = [
  { id: 'gonal-f', brand_name_ko: '고날에프', brand_name_en: 'Gonal-F', aliases: ['Gonal-F', '고날에프', '고날-에프', '폴리트로핀 알파', 'FSH'] },
  { id: 'menopur', brand_name_ko: '메노푸어', brand_name_en: 'Menopur', aliases: ['Menopur', '메노푸어', '메노퓨어', '메노트로핀'] },
];

describe('Clinic Guide medication alias normalization', () => {
  it('matches known IVF medication aliases from free text without needing an LLM', () => {
    expect(findMedicationAliasMatch(medications, '오늘 고날에프 추가됐어요')?.id).toBe('gonal-f');
    expect(findMedicationAliasMatch(medications, '고날')?.id).toBe('gonal-f');
    expect(findMedicationAliasMatch(medications, 'FSH 처방 받았어요')?.id).toBe('gonal-f');
    expect(findMedicationAliasMatch(medications, '메노퓨어도 같이 받아왔어요')?.id).toBe('menopur');
  });

  it('fails closed when no medication alias is known', () => {
    expect(findMedicationAliasMatch(medications, '이름을 잘 모르겠어요')).toBeNull();
  });

  it('resolves selected medication ids to Korean brand names for confirmation copy', () => {
    expect(resolveMedicationNames(medications, ['gonal-f', 'missing-id'])).toEqual(['고날에프', 'missing-id']);
  });
});
