import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../../src/config';
import { MoreScreen } from '../../../src/features/more/more-screen';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { PartnerLink } from '../../../src/types/slc.types';
import { buildPresentationPartnerLinks } from '../../../src/features/presentation/presentation-testbed';
import { cookies, headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function MorePage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    const { existingLink, pendingRequest } = buildPresentationPartnerLinks();
    return <MoreScreen userId="presentation-user" existingLink={existingLink} pendingRequests={[pendingRequest]} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const cookieStore = await cookies();
  const role = isMissingSlcTable(profileError) ? cookieStore.get(SLC_ROLE_COOKIE)?.value : profile?.role;
  if (role === 'partner') redirect('/partner');

  const [existingRes, pendingRes] = await Promise.all([
    supabase.from('partner_links').select(PARTNER_LINK_WITH_PROFILE_SELECT).eq('patient_id', user.id).in('status', ['pending', 'requested', 'approved']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('partner_links').select(PARTNER_LINK_WITH_PROFILE_SELECT).eq('patient_id', user.id).eq('status', 'requested').order('requested_at', { ascending: false }),
  ]);

  if (existingRes.error || pendingRes.error) {
    return <MoreScreen userId={user.id} existingLink={null} pendingRequests={[]} />;
  }

  return <MoreScreen userId={user.id} existingLink={(existingRes.data as PartnerLink | null) ?? null} pendingRequests={(pendingRes.data ?? []) as PartnerLink[]} />;
}

const PARTNER_LINK_WITH_PROFILE_SELECT = '*, partner_profile:user_profiles!partner_id(display_name)';
