import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Supabase SSR cookie contract', () => {
  it('uses getAll/setAll so auth cookies and refreshed sessions are visible to API routes', () => {
    const supabaseSource = readFileSync('src/lib/supabase.ts', 'utf8');
    const serverSource = readFileSync('src/lib/server-supabase.ts', 'utf8');

    expect(supabaseSource).toContain('getAll(): Array<{ name: string; value: string }>');
    expect(supabaseSource).toContain('setAll(cookies: Array<{ name: string; value: string; options: CookieOptions }>)');
    expect(supabaseSource).not.toContain('get(name: string)');
    expect(supabaseSource).not.toContain('remove(name: string');

    expect(serverSource).toContain('cookieStore.getAll()');
    expect(serverSource).toContain('setAll(cookiesToSet)');
    expect(serverSource).toContain('cookieStore.set({ name, value, ...options })');
  });
});
