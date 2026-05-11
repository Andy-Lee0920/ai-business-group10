import { describe, expect, it } from 'vitest';
import { isPresentationHost, isPresentationMode, isPresentationRequest } from '../src/config';
import { requireSupabasePublicConfig } from '../src/lib/env';

describe('Supabase public env contract', () => {
  it('throws a clear error when public Supabase config is missing', () => {
    expect(() => requireSupabasePublicConfig({})).toThrow(
      'Missing Supabase public config: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  });

  it('accepts explicit public Supabase config', () => {
    expect(
      requireSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });
  });
});

describe('presentation mode env contract', () => {
  it('is off by default for real Supabase deployments', () => {
    expect(isPresentationMode({})).toBe(false);
  });

  it('turns on with a public Vercel-safe flag', () => {
    expect(isPresentationMode({ NEXT_PUBLIC_FEVIO_PRESENTATION_MODE: '1' })).toBe(true);
  });

  it('turns on for the configured presentation Vercel host even when the flag is missing', () => {
    expect(isPresentationHost('https://ai-business-group10.vercel.app')).toBe(true);
    expect(
      isPresentationRequest({
        headers: new Headers({ host: 'ai-business-group10.vercel.app' }),
      }),
    ).toBe(true);
  });

  it('keeps unrelated Vercel hosts in the real lane unless explicitly configured', () => {
    expect(isPresentationHost('project-oznp0.vercel.app')).toBe(false);
    expect(isPresentationHost('project-oznp0.vercel.app:443')).toBe(false);
  });
});
