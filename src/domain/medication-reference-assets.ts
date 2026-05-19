export type MedicationReferenceAsset = {
  normalizedKey: string;
  displayLabel: string;
  assetPath: string;
};

const ASSETS: Record<string, MedicationReferenceAsset> = {
  ovidrel: { normalizedKey: 'ovidrel', displayLabel: '오비드렐', assetPath: '/assets/medications/ovidrel.svg' },
  'gonal-f': { normalizedKey: 'gonal-f', displayLabel: '고날에프', assetPath: '/assets/medications/gonal-f.svg' },
  cetrotide: { normalizedKey: 'cetrotide', displayLabel: '세트로타이드', assetPath: '/assets/medications/cetrotide.svg' },
  menopur: { normalizedKey: 'menopur', displayLabel: '메노푸어', assetPath: '/assets/medications/menopur.svg' },
};

const TITLE_KEYS: Array<[RegExp, keyof typeof ASSETS]> = [
  [/\b(?:ovidrel|ovitrelle)\b|오비드렐/iu, 'ovidrel'],
  [/\b(?:gonal[-\s]?f)\b|고날\s*(?:에프|f)/iu, 'gonal-f'],
  [/\bcetrotide\b|세트로\s*타이드/iu, 'cetrotide'],
  [/\bmenopur\b|메노푸[어르]/iu, 'menopur'],
];

export function resolveMedicationReferenceAsset(input: { medicationId?: string | null; title?: string | null }): MedicationReferenceAsset | null {
  const medicationKey = normalizeMedicationKey(input.medicationId);
  if (medicationKey && ASSETS[medicationKey]) return ASSETS[medicationKey];

  const title = input.title?.trim() ?? '';
  if (!title) return null;
  const match = TITLE_KEYS.find(([pattern]) => pattern.test(title));
  return match ? ASSETS[match[1]] : null;
}

function normalizeMedicationKey(value: string | null | undefined) {
  if (!value) return null;
  const key = value.trim().toLowerCase().replace(/_/gu, '-');
  if (key === 'gonal' || key === 'gonalf') return 'gonal-f';
  if (key === 'ovitrelle') return 'ovidrel';
  return key;
}
