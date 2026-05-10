import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { requireSupabasePublicConfig, type SupabasePublicConfig } from './env';

type CookieMethods = {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
};

function requireExplicitConfig(config?: Partial<SupabasePublicConfig>): SupabasePublicConfig {
  return requireSupabasePublicConfig({
    NEXT_PUBLIC_SUPABASE_URL: config?.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: config?.anonKey,
  });
}

export function createFevioBrowserSupabaseClient(config?: Partial<SupabasePublicConfig>) {
  const publicConfig = config ? requireExplicitConfig(config) : requireSupabasePublicConfig();
  return createBrowserClient(publicConfig.url, publicConfig.anonKey);
}

export function createFevioServerSupabaseClient(cookies: CookieMethods, config?: Partial<SupabasePublicConfig>) {
  const publicConfig = config ? requireExplicitConfig(config) : requireSupabasePublicConfig();

  return createServerClient(publicConfig.url, publicConfig.anonKey, {
    cookies: {
      get: cookies.get,
      set: cookies.set,
      remove: cookies.remove,
    },
  });
}
