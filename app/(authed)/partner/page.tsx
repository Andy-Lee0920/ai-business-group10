import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../../src/config';
import { PartnerView } from '../../../src/features/partner/partner-view';
import { SLCIllustration } from '../../../src/components/slc-illustration';
import { slcAssets } from '../../../src/design/slc-assets';
import { partnerStateCopy, type PartnerProjectionState } from '../../../src/features/partner/partner-state';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { buildPresentationClinicUpdates, buildPresentationCompletions, buildPresentationItems } from '../../../src/features/presentation/presentation-testbed';
import { cookies, headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    return (
      <PartnerView
        items={buildPresentationItems()}
        completions={buildPresentationCompletions()}
        latestClinicUpdate={buildPresentationClinicUpdates()[0] ?? null}
      />
    );
  }

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

  if (linkError) return <PartnerEmptyState state="not_linked" />;
  if (!link) return <PartnerEmptyState state="not_linked" />;
  if (link.status !== 'approved') return <PartnerEmptyState state="requested" />;

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
    return <PartnerView items={[]} completions={[]} latestClinicUpdate={null} />;
  }

  return <PartnerView items={itemsRes.data ?? []} completions={completionsRes.data ?? []} latestClinicUpdate={clinicRes.data?.[0] ?? null} />;
}

function PartnerEmptyState({ state }: { state: Exclude<PartnerProjectionState, 'linked_no_schedule' | 'linked_with_schedule'> }) {
  const copy = partnerStateCopy(state);
  const refreshHint = state === 'requested' ? ' 새로고침해서 확인해 주세요' : '';
  const asset = state === 'requested' ? slcAssets.partner.connectedSuccess : slcAssets.partner.invite;
  return (
    <div style={{ minHeight: '100dvh', padding: '72px 24px', background: 'var(--slc-bg)', textAlign: 'center' }}>
      <SLCIllustration asset={asset} size="empty" priority />
      <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--slc-text)', marginBottom: 8 }}>{copy.title}</p>
      <p style={{ fontSize: 14, color: 'var(--slc-muted)', lineHeight: 1.6 }}>{copy.description}{refreshHint}</p>
    </div>
  );
}
