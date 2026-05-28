import { AdminSeedForm } from '../../../src/features/admin/admin-seed-form';
import { getAdminUser } from '../../../src/lib/admin-auth';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

export default async function AdminSeedPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const admin = await getAdminUser(supabase);
  if (!admin) return <main style={pageStyle}><h1 style={titleStyle}>접근할 수 없습니다</h1></main>;

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>운영팀 안내 seed</h1>
      <p style={leadStyle}>커뮤니티 피드에 검수 완료된 운영팀 안내를 발행합니다.</p>
      <AdminSeedForm />
    </main>
  );
}

const pageStyle = { minHeight: '100dvh', padding: '48px 20px 96px', background: 'var(--slc-bg)' } as const;
const titleStyle = { margin: 0, color: 'var(--slc-text)', fontSize: 30, fontWeight: 950, letterSpacing: '-0.05em' } as const;
const leadStyle = { color: 'var(--slc-muted)', fontSize: 14, fontWeight: 750, lineHeight: 1.5 } as const;
