import { cookies } from 'next/headers';
import { createFevioServerSupabaseClient } from './supabase';

export async function createCookieBackedSupabaseClient() {
  const cookieStore = await cookies();

  return createFevioServerSupabaseClient({
    get(name) {
      return cookieStore.get(name)?.value;
    },
    set(name, value, options) {
      cookieStore.set({ name, value, ...options });
    },
    remove(name, options) {
      cookieStore.set({ name, value: '', ...options, maxAge: 0 });
    },
  });
}
