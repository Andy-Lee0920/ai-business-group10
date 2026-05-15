import { cookies } from 'next/headers';
import { createFevioServerSupabaseClient } from './supabase';

export async function createCookieBackedSupabaseClient() {
  const cookieStore = await cookies();

  return createFevioServerSupabaseClient({
    getAll() {
      return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      for (const { name, value, options } of cookiesToSet) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot always write cookies. Middleware and Route
          // Handlers will persist refreshed Supabase auth cookies when allowed.
        }
      }
    },
  });
}
