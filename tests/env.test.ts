import { describe, expect, it } from 'vitest';
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
