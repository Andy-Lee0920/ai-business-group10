import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) redirect(`/privacy?mode=presentation&invite=${encodeURIComponent(code)}`);

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/sign-in?next=/invite/${code}`);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'partner') redirect('/partner');
  if (profile?.role === 'patient') redirect('/home');
  redirect(`/onboarding?invite=${code}`);
}
