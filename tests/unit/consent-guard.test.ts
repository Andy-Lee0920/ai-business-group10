import { describe, expect, it } from 'vitest';
import { computeConsentRedirect } from '../../src/lib/consent-guard';

describe('SLC consent guard', () => {
  it('redirects users without Fevio SLC consent to onboarding', () => {
    expect(computeConsentRedirect(null)).toBe('/onboarding');
  });

  it('allows users with a saved role consent to continue', () => {
    expect(computeConsentRedirect({ role: 'patient' })).toBeNull();
    expect(computeConsentRedirect({ role: 'partner' })).toBeNull();
  });
});
