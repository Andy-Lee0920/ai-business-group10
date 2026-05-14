import { describe, expect, it } from 'vitest';
import { isProtectedAppPath } from '../../src/config/protected-routes';

describe('production protected app route contract', () => {
  it('requires an authenticated session before direct SLC app entry', () => {
    expect(isProtectedAppPath('/home')).toBe(true);
    expect(isProtectedAppPath('/records')).toBe(true);
    expect(isProtectedAppPath('/clinic-update')).toBe(true);
    expect(isProtectedAppPath('/add')).toBe(true);
    expect(isProtectedAppPath('/more')).toBe(true);
    expect(isProtectedAppPath('/partner')).toBe(true);
    expect(isProtectedAppPath('/onboarding')).toBe(true);
  });

  it('leaves public, auth, privacy, invite, and legacy partner token surfaces reachable', () => {
    expect(isProtectedAppPath('/')).toBe(false);
    expect(isProtectedAppPath('/auth/sign-in')).toBe(false);
    expect(isProtectedAppPath('/privacy')).toBe(false);
    expect(isProtectedAppPath('/invite/abc123')).toBe(false);
    expect(isProtectedAppPath('/capture')).toBe(false);
    expect(isProtectedAppPath('/keyword-review')).toBe(false);
    expect(isProtectedAppPath('/partner/token-123')).toBe(false);
  });
});
