import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { BottomNav } from '../../src/components/bottom-nav';
import { isPresentationRequest } from '../../src/config';
import { computeConsentRedirect } from '../../src/lib/consent-guard';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, isMissingSlcTable, type SlcRole } from '../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const presentationMode = isPresentationRequest({ headers: requestHeaders });
  const skipSupabase = presentationMode;
  const supabase = skipSupabase ? null : await createCookieBackedSupabaseClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user && !presentationMode) redirect('/auth/sign-in');

  const [consentResult, profileResult, existingScheduleResult, existingCareCardResult] = user && supabase
    ? await Promise.all([
      supabase
        .from('user_consents')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('schedule_items')
        .select('id')
        .eq('patient_id', user.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('care_action_cards')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .maybeSingle(),
    ])
    : [{ data: null, error: null }, { data: null, error: null }, { data: null, error: null }, { data: null, error: null }];
  const cookieStore = await cookies();
  const fallbackRole = normalizeRole(cookieStore.get(SLC_ROLE_COOKIE)?.value);
  const completedOnboardingRole = normalizeRoleContext(cookieStore.get('fevio_onboarding_role_context')?.value);
  const persistedRole = normalizeRole(consentResult.data?.role) ?? normalizeRole(profileResult.data?.role);
  const recoveredConsent = !persistedRole && !consentResult.error && user && supabase && completedOnboardingRole
    ? await recoverConsentFromCompletedOnboarding(supabase, user, completedOnboardingRole)
    : null;
  const hasExistingCareData = (Boolean(existingScheduleResult.data) || Boolean(existingCareCardResult.data))
    && !existingScheduleResult.error
    && !existingCareCardResult.error;
  const effectiveConsent = presentationMode && !user
    ? { role: fallbackRole ?? 'patient' }
    : recoveredConsent ?? (persistedRole
      ? { role: persistedRole }
      : (isMissingSlcTable(consentResult.error) || isMissingSlcTable(profileResult.error)) ? { role: fallbackRole ?? 'patient' } : null);

  const redirectTo = computeConsentRedirect(effectiveConsent, hasExistingCareData);
  if (redirectTo) redirect(redirectTo);

  const showBottomNav = effectiveConsent?.role === 'patient';

  return (
    <div className="fevio-authed-frame" data-bottom-nav={showBottomNav ? 'true' : 'false'}>
      <main className="fevio-authed-main">{children}</main>
      {showBottomNav && <BottomNav />}
      <div id="fevio-confirm-portal" />
    </div>
  );
}

function normalizeRole(value: string | undefined): SlcRole | null {
  return value === 'patient' || value === 'partner' ? value : null;
}


function normalizeRoleContext(value: string | undefined): SlcRole | null {
  if (value === 'partner') return 'partner';
  if (value === 'patient' || value === 'together' || value === 'primary_solo' || value === 'primary_with_partner') return 'patient';
  return null;
}

async function recoverConsentFromCompletedOnboarding(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  user: { id: string; user_metadata?: { full_name?: unknown } },
  role: SlcRole,
) {
  const now = new Date().toISOString();
  const displayName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
  const profile = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, role, display_name: displayName, updated_at: now });
  if (profile.error && !isMissingSlcTable(profile.error)) return null;

  const consent = await supabase
    .from('user_consents')
    .upsert({
      user_id: user.id,
      role,
      consent_version: 'slc-v1',
      privacy_boundary_accepted_at: now,
      sensitive_data_accepted_at: now,
      medical_disclaimer_accepted_at: now,
      input_assist_disclaimer_accepted_at: now,
      partner_sharing_accepted_at: role === 'partner' ? now : null,
      consent_source: 'onboarding',
    });
  if (consent.error && !isMissingSlcTable(consent.error)) return null;

  return { role };
}
