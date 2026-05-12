import { describe, expect, it } from 'vitest';
import { shouldResetAppSession } from '../../src/config/session-refresh';

describe('browser session refresh contract', () => {
  it('lets testers reset app state from any production URL with refresh=1 or reset=1', () => {
    expect(shouldResetAppSession(new URL('https://project-oznp0.vercel.app/home?care=waiting&refresh=1'))).toBe(true);
    expect(shouldResetAppSession(new URL('https://project-oznp0.vercel.app/home?reset=1'))).toBe(true);
  });

  it('does not loop on the reset route or reset normal care preview URLs', () => {
    expect(shouldResetAppSession(new URL('https://project-oznp0.vercel.app/auth/reset?refresh=1'))).toBe(false);
    expect(shouldResetAppSession(new URL('https://project-oznp0.vercel.app/home?care=waiting'))).toBe(false);
  });
});
