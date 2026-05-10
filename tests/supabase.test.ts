import { describe, expect, it } from 'vitest';
import { createFevioBrowserSupabaseClient } from '../src/lib/supabase';

describe('Fevio Supabase client factories', () => {
  it('refuses empty browser config', () => {
    expect(() => createFevioBrowserSupabaseClient({ url: '', anonKey: '' })).toThrow(
      'Missing Supabase public config: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  });

  it('constructs a browser client from explicit test config', () => {
    const client = createFevioBrowserSupabaseClient({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });

    expect(client.auth).toBeDefined();
    expect(client.from).toBeTypeOf('function');
  });
});
