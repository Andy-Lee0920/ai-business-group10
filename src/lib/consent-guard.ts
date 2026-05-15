export type ConsentRole = 'patient' | 'partner';

export interface ConsentGuardRecord {
  role: ConsentRole;
}

export function computeConsentRedirect(consent: ConsentGuardRecord | null, hasExistingCareData = false): '/onboarding' | null {
  if (consent || hasExistingCareData) return null;
  return '/onboarding';
}
