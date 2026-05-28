import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPresentationRequest } from '../../../src/config';
import { buildPresentationPartnerLinks } from '../../../src/features/presentation/presentation-testbed';
import { MoreScreen } from '../../../src/features/more/more-screen';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { PartnerLink } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    const { existingLink, pendingRequest } = buildPresentationPartnerLinks();
    return <MoreScreen userId="presentation-user" existingLink={existingLink} pendingRequests={[pendingRequest]} email="demo@fevio.app" provider="presentation" nickname="페비오메이트" privacyGateAccepted closedBetaStatus="closed beta" />;
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

  const accountStatus = await loadAccountStatus(supabase, user.id, user.email ?? null, user.app_metadata?.provider ?? null);

  if (existingRes.error || pendingRes.error) {
    return <MoreScreen userId={user.id} existingLink={null} pendingRequests={[]} {...accountStatus} />;
  }

  return <MoreScreen userId={user.id} existingLink={(existingRes.data as PartnerLink | null) ?? null} pendingRequests={(pendingRes.data ?? []) as PartnerLink[]} {...accountStatus} />;
}

const PARTNER_LINK_WITH_PROFILE_SELECT = '*, partner_profile:user_profiles!partner_id(display_name)';


async function loadAccountStatus(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
  email: string | null,
  provider: unknown,
) {
  const { data: member } = await supabase.from('couple_members').select('couple_id, role').eq('user_id', userId).limit(1).maybeSingle();
  const coupleId = typeof member?.couple_id === 'string' ? member.couple_id : null;
  const role = member?.role === 'partner' ? 'partner' : 'primary';
  const [{ data: identity }, { data: state }] = await Promise.all([
    coupleId ? supabase.from('community_identities').select('nickname').eq('couple_id', coupleId).eq('role', role).maybeSingle() : Promise.resolve({ data: null }),
    coupleId ? supabase.from('couple_states').select('privacy_accepted_at').eq('couple_id', coupleId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    email,
    provider: typeof provider === 'string' ? provider : null,
    nickname: typeof identity?.nickname === 'string' ? identity.nickname : null,
    privacyGateAccepted: Boolean(state?.privacy_accepted_at),
    closedBetaStatus: 'closed beta',
  };
}
