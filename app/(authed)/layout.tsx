import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BottomNav } from '../../src/components/bottom-nav';
import { isPresentationMode } from '../../src/config';
import { computeConsentRedirect } from '../../src/lib/consent-guard';
import { hasSupabasePublicConfig } from '../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../src/lib/server-supabase';
import { SLC_ROLE_COOKIE, isMissingSlcTable, type SlcRole } from '../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const presentationMode = isPresentationMode();
  const skipSupabase = presentationMode && !hasSupabasePublicConfig();
  const supabase = skipSupabase ? null : await createCookieBackedSupabaseClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user && !presentationMode) redirect('/auth/sign-in');

  const { data: consent, error: consentError } = user && supabase
    ? await supabase
      .from('user_consents')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    : { data: null, error: null };
  const cookieStore = await cookies();
  const fallbackRole = normalizeRole(cookieStore.get(SLC_ROLE_COOKIE)?.value);
  const completedOnboardingRole = normalizeRoleContext(cookieStore.get('fevio_onboarding_role_context')?.value);
  const recoveredConsent = !consent && !consentError && user && supabase && completedOnboardingRole
    ? await recoverConsentFromCompletedOnboarding(supabase, user, completedOnboardingRole)
    : null;
  const effectiveConsent = presentationMode && !user
    ? { role: fallbackRole ?? 'patient' }
    : recoveredConsent ?? (isMissingSlcTable(consentError) && fallbackRole ? { role: fallbackRole } : consent);

  const redirectTo = computeConsentRedirect(effectiveConsent);
  if (redirectTo) redirect(redirectTo);

  return (
    <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: 'var(--slc-bg)' }}>
      <main style={{ minHeight: '100dvh', paddingBottom: effectiveConsent?.role === 'patient' ? 88 : 0 }}>{children}</main>
      {effectiveConsent?.role === 'patient' && <BottomNav />}
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
