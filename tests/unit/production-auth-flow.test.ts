import { describe, expect, it } from 'vitest';
import { isPresentationHost, isPresentationRequest } from '../../src/config';

describe('production auth flow host contract', () => {
  it('does not treat the production alias as a presentation/demo host', () => {
    expect(isPresentationHost('project-oznp0.vercel.app')).toBe(false);
    expect(
      isPresentationRequest({
        headers: new Headers({ host: 'project-oznp0.vercel.app' }),
      }),
    ).toBe(false);
  });



  it('lets configured presentation production hosts reach home without a signed-in user', () => {
    const homePage = require('node:fs').readFileSync('app/(authed)/home/page.tsx', 'utf8') as string;
    expect(homePage).toContain('const presentationMode = isPresentationMode()');
    expect(homePage).toContain('if (!user) {');
    expect(homePage).toContain('if (presentationMode) {');
    expect(homePage).toContain('fallbackScheduleItems(userId)');
    expect(homePage.indexOf('if (presentationMode) {')).toBeLessThan(homePage.indexOf("redirect('/auth/sign-in')"));
  });

  it('keeps the explicit demo host available for presentation QA', () => {
    expect(isPresentationHost('ai-business-group10.vercel.app')).toBe(true);
  });
});
