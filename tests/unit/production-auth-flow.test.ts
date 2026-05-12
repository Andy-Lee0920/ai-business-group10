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

  it('keeps the explicit demo host available for presentation QA', () => {
    expect(isPresentationHost('ai-business-group10.vercel.app')).toBe(true);
  });
});
