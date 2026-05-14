import type { Medication, ScheduleItem } from '../types/slc.types';
import { getPresentationSeedItems } from './seed-helpers';

export const SLC_ROLE_COOKIE = 'fevio_slc_role_v1';
export const SLC_CONSENT_COOKIE = 'fevio_slc_consent_v1';

export type SlcRole = 'patient' | 'partner';

export function isMissingSlcTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === 'PGRST205' || candidate.message?.includes('Could not find the table') === true;
}

export function fallbackCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function fallbackScheduleItems(patientId: string): ScheduleItem[] {
  return getPresentationSeedItems(patientId).map((item, index) => ({
    ...item,
    id: `fallback-${index + 1}`,
    created_at: new Date().toISOString(),
  }));
}

export function fallbackMedications(): Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'aliases' | 'default_unit' | 'default_cta'>[] {
  return [
    { id: 'menopur', brand_name_ko: '메노푸어', brand_name_en: 'Menopur', aliases: ['메노퓨어', '메노트로핀'], default_unit: 'IU', default_cta: '주사하기' },
    { id: 'cetrotide', brand_name_ko: '세트로타이드', brand_name_en: 'Cetrotide', aliases: ['세트로렐릭스'], default_unit: 'mg', default_cta: '주사하기' },
    { id: 'gonal-f', brand_name_ko: '고날에프', brand_name_en: 'Gonal-F', aliases: ['폴리트로핀 알파', 'FSH'], default_unit: 'IU', default_cta: '주사하기' },
    { id: 'ovidrel', brand_name_ko: '오비드렐', brand_name_en: 'Ovidrel', aliases: ['Ovitrelle', '코리오고나도트로핀'], default_unit: 'syringe', default_cta: '주사하기' },
    { id: 'crinone', brand_name_ko: '크리논', brand_name_en: 'Crinone', aliases: [], default_unit: '개', default_cta: '사용하기' },
  ];
}
