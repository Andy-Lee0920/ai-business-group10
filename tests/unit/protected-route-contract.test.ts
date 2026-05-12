import { describe, expect, it } from 'vitest';
import { isProtectedAppPath } from '../../src/config/protected-routes';

describe('production protected app route contract', () => {
  it('requires an authenticated session before direct home/onboarding entry', () => {
    expect(isProtectedAppPath('/home')).toBe(true);
    expect(isProtectedAppPath('/home/sub')).toBe(true);
    expect(isProtectedAppPath('/onboarding')).toBe(true);
  });

  it('leaves public, auth, privacy, and partner token surfaces reachable', () => {
    expect(isProtectedAppPath('/')).toBe(false);
    expect(isProtectedAppPath('/auth/sign-in')).toBe(false);
    expect(isProtectedAppPath('/privacy')).toBe(false);
    expect(isProtectedAppPath('/partner/demo')).toBe(false);
    expect(isProtectedAppPath('/partner/token-123')).toBe(false);
  });
});
