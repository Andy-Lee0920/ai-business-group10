import { describe, expect, it } from 'vitest';
import { computeConsentRedirect } from '../../src/lib/consent-guard';

describe('SLC consent guard', () => {
  it('redirects users without Fevio SLC consent or care data to onboarding', () => {
    expect(computeConsentRedirect(null)).toBe('/onboarding');
  });

  it('allows existing Supabase care history to continue without repeating onboarding', () => {
    expect(computeConsentRedirect(null, true)).toBeNull();
  });

  it('allows users with a saved role consent to continue', () => {
    expect(computeConsentRedirect({ role: 'patient' })).toBeNull();
    expect(computeConsentRedirect({ role: 'partner' })).toBeNull();
  });
});
