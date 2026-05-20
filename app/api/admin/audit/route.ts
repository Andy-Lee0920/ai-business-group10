import { NextResponse } from 'next/server';
import { requireAdminUser } from '../../../../src/lib/admin-auth';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await requireAdminUser(supabase);
  if (admin instanceof NextResponse) return admin;

  const audited = createAuditedSupabaseServiceRoleClient();
  const result = await audited.withAudit(
    { actor: admin.email, route: '/api/admin/audit', target_type: 'service_role_audit_logs', target_id: null, action: 'read_audit_api' },
    async (client) => client.from('service_role_audit_logs').select('id, actor, route, target_type, target_id, action, ts').order('ts', { ascending: false }).limit(100),
  );

  if (result.error) return NextResponse.json({ error: 'audit_unavailable' }, { status: 500 });
  return NextResponse.json({ logs: result.data ?? [] });
}
