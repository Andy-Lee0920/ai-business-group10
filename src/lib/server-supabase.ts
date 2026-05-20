import { cookies } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireSupabasePublicConfig } from './env';
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

export interface ServiceRoleAuditEvent {
  actor: string;
  route: string;
  target_type: string;
  target_id: string | null;
  action: string;
  ts?: string;
}

export interface ServiceRoleAuditResult {
  ok: boolean;
  errorMessage: string | null;
}

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

export async function recordServiceRoleAuditEvent(
  client: SupabaseClient,
  event: ServiceRoleAuditEvent,
): Promise<ServiceRoleAuditResult> {
  const row = {
    actor: event.actor,
    route: event.route,
    target_type: event.target_type,
    target_id: event.target_id,
    action: event.action,
    ts: event.ts ?? new Date().toISOString(),
  };
  const { error } = await client.from('service_role_audit_logs').insert(row);
  return { ok: !error, errorMessage: error?.message ?? null };
}

export function createAuditedSupabaseServiceRoleClient() {
  const client = createSupabaseServiceRoleClient();
  return {
    client,
    audit(event: ServiceRoleAuditEvent) {
      return recordServiceRoleAuditEvent(client, event);
    },
    async withAudit<T>(event: ServiceRoleAuditEvent, operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
      const result = await operation(client);
      await recordServiceRoleAuditEvent(client, event);
      return result;
    },
  };
}

