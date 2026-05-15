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

  const { data: consent, error: consentError } = user && supabase
    ? await supabase
      .from('user_consents')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    : { data: null, error: null };
  const cookieStore = await cookies();
  const fallbackRole = normalizeRole(cookieStore.get(SLC_ROLE_COOKIE)?.value);
  const effectiveConsent = presentationMode && !user
    ? { role: fallbackRole ?? 'patient' }
    : isMissingSlcTable(consentError) && fallbackRole ? { role: fallbackRole } : consent;

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
