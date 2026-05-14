import { redirect } from 'next/navigation';
import { PartnerView } from '../../../src/features/partner/partner-view';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const cookieStore = await cookies();
  const role = isMissingSlcTable(profileError) ? cookieStore.get(SLC_ROLE_COOKIE)?.value : profile?.role;
  if (role !== 'partner') redirect('/home');

  const { data: link, error: linkError } = await supabase
    .from('partner_links')
    .select('patient_id, status')
    .eq('partner_id', user.id)
    .maybeSingle();

  if (linkError) {
    if (isMissingSlcTable(linkError)) return <PartnerEmptyState />;
    throw new Error(linkError.message);
  }
  if (!link || link.status !== 'approved') return <PartnerEmptyState />;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [itemsRes, completionsRes, clinicRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', link.patient_id)
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase.from('completion_records').select('*').eq('patient_id', link.patient_id)
      .gte('completed_at', todayStart.toISOString()),
    supabase.from('clinic_updates').select('*').eq('patient_id', link.patient_id)
      .order('created_at', { ascending: false }).limit(1),
  ]);

  if (itemsRes.error || completionsRes.error || clinicRes.error) {
    if (isMissingSlcTable(itemsRes.error) || isMissingSlcTable(completionsRes.error) || isMissingSlcTable(clinicRes.error)) {
      return <PartnerView items={[]} completions={[]} latestClinicUpdate={null} />;
    }
    if (itemsRes.error) throw new Error(itemsRes.error.message);
    if (completionsRes.error) throw new Error(completionsRes.error.message);
    if (clinicRes.error) throw new Error(clinicRes.error.message);
  }

  return <PartnerView items={itemsRes.data ?? []} completions={completionsRes.data ?? []} latestClinicUpdate={clinicRes.data?.[0] ?? null} />;
}

function PartnerEmptyState() {
  return (
    <div style={{ minHeight: '100dvh', padding: '72px 24px', background: 'var(--slc-bg)', textAlign: 'center' }}>
      <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--slc-text)', marginBottom: 8 }}>연결 대기 중</p>
      <p style={{ fontSize: 14, color: 'var(--slc-muted)', lineHeight: 1.6 }}>치료자가 요청을 승인하면 오늘 일정과 완료 상태를 읽기 전용으로 볼 수 있어요.</p>
    </div>
  );
}
