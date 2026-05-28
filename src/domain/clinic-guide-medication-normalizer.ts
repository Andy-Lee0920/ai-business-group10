import type { Medication } from '../types/slc.types';

export type ClinicGuideMedicationOption = Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'aliases'>;

export function findMedicationAliasMatch<T extends ClinicGuideMedicationOption>(medications: T[], userInput: string): T | null {
  const normalizedInput = normalizeMedicationText(userInput);
  if (!normalizedInput) return null;

  return medications.find((medication) => {
    const candidates = [medication.brand_name_ko, medication.brand_name_en, ...medication.aliases]
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalizeMedicationText);

    return candidates.some((candidate) => candidate.length > 0 && (normalizedInput.includes(candidate) || candidate.includes(normalizedInput)));
  }) ?? null;
}

export function resolveMedicationNames<T extends Pick<Medication, 'id' | 'brand_name_ko'>>(medications: T[], medicationIds: string[]): string[] {
  const nameById = new Map(medications.map((medication) => [medication.id, medication.brand_name_ko]));
  return medicationIds.map((id) => nameById.get(id) ?? id);
}

function normalizeMedicationText(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s\-_()]/gu, '');
}
