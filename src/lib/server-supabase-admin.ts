import { createClient } from '@supabase/supabase-js';
import { requireSupabasePublicConfig } from './env';

export function requireSupabaseServiceRoleKey(source: Record<string, string | undefined> = process.env) {
  const key = source.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error('Missing Supabase service role config: SUPABASE_SERVICE_ROLE_KEY');
  return key;
}

export function createSupabaseServiceRoleClient() {
  const publicConfig = requireSupabasePublicConfig();
  return createClient(publicConfig.url, requireSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
