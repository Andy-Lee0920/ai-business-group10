import { getAdminUser } from '../../../src/lib/admin-auth';
import { createAuditedSupabaseServiceRoleClient, createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await getAdminUser(supabase);
  if (!admin) return <main style={pageStyle}><h1 style={titleStyle}>접근할 수 없습니다</h1></main>;

  const audited = createAuditedSupabaseServiceRoleClient();
  const { data } = await audited.withAudit(
    { actor: admin.email, route: '/admin/audit', target_type: 'service_role_audit_logs', target_id: null, action: 'read_audit_ui' },
    async (client) => client.from('service_role_audit_logs').select('id, actor, route, target_type, target_id, action, ts').order('ts', { ascending: false }).limit(50),
  );

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>Audit log</h1>
      <p style={leadStyle}>service-role 접근 기록을 확인합니다.</p>
      <section style={cardStyle}>
        {(data ?? []).map((row) => (
          <article key={row.id} style={rowStyle}>
            <strong>{row.action}</strong>
            <span>{row.actor} · {row.route}</span>
            <small>{row.target_type} / {row.target_id ?? '-'} / {row.ts}</small>
          </article>
        ))}
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100dvh', padding: '48px 20px 96px', background: 'var(--slc-bg)' } as const;
const titleStyle = { margin: 0, color: 'var(--slc-text)', fontSize: 30, fontWeight: 950, letterSpacing: '-0.05em' } as const;
const leadStyle = { color: 'var(--slc-muted)', fontSize: 14, fontWeight: 750, lineHeight: 1.5 } as const;
const cardStyle = { display: 'grid', gap: 10, borderRadius: 24, background: 'rgba(255,255,255,0.88)', border: '1px solid var(--slc-border)', padding: 18 } as const;
const rowStyle = { display: 'grid', gap: 4, color: 'var(--slc-text)', fontSize: 13, borderBottom: '1px solid var(--slc-border)', paddingBottom: 10 } as const;
