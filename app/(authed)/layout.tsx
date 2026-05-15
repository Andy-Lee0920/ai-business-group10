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

  const [consentResult, profileResult, existingScheduleResult] = user && supabase
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
    ])
    : [{ data: null, error: null }, { data: null, error: null }, { data: null, error: null }];
  const cookieStore = await cookies();
  const fallbackRole = normalizeRole(cookieStore.get(SLC_ROLE_COOKIE)?.value);
  const persistedRole = normalizeRole(consentResult.data?.role) ?? normalizeRole(profileResult.data?.role);
  const hasExistingCareData = Boolean(existingScheduleResult.data) && !existingScheduleResult.error;
  const effectiveConsent = presentationMode && !user
    ? { role: fallbackRole ?? 'patient' }
    : persistedRole
      ? { role: persistedRole }
      : (isMissingSlcTable(consentResult.error) || isMissingSlcTable(profileResult.error)) && fallbackRole ? { role: fallbackRole } : null;

  const redirectTo = computeConsentRedirect(effectiveConsent, hasExistingCareData);
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
