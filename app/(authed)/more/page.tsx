import { MoreScreen } from '../../../src/features/more/more-screen';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function MorePage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [existingRes, pendingRes] = await Promise.all([
    supabase.from('partner_links').select('*').eq('patient_id', user.id).in('status', ['pending', 'requested', 'approved']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('partner_links').select('*').eq('patient_id', user.id).eq('status', 'requested').order('requested_at', { ascending: false }),
  ]);

  if (existingRes.error || pendingRes.error) {
    if (isMissingSlcTable(existingRes.error) || isMissingSlcTable(pendingRes.error)) {
      return <MoreScreen userId={user.id} existingLink={null} pendingRequests={[]} />;
    }
    if (existingRes.error) throw new Error(existingRes.error.message);
    if (pendingRes.error) throw new Error(pendingRes.error.message);
  }

  return <MoreScreen userId={user.id} existingLink={existingRes.data ?? null} pendingRequests={pendingRes.data ?? []} />;
}
