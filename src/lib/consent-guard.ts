export type ConsentRole = 'patient' | 'partner';

export interface ConsentGuardRecord {
  role: ConsentRole;
}

export function computeConsentRedirect(consent: ConsentGuardRecord | null): '/onboarding' | null {
  return consent ? null : '/onboarding';
}
