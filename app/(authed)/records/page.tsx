import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { RecordsScreen } from '../../../src/features/records/records-screen';
import { buildPresentationClinicUpdates, buildPresentationCompletions, buildPresentationItems } from '../../../src/features/presentation/presentation-testbed';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { Receipt } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

type CoupleMemberRow = { couple_id: string };

export default async function RecordsPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    return (
      <RecordsScreen
        items={buildPresentationItems()}
        completions={buildPresentationCompletions()}
        clinicUpdates={buildPresentationClinicUpdates()}
        receipts={[]}
      />
    );
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .eq('role', 'primary')
    .limit(1)
    .maybeSingle<CoupleMemberRow>();

  const receiptsQuery = memberRes.data?.couple_id
    ? supabase
      .from('receipts')
      .select('id,couple_id,amount,category,date,note,created_at')
      .eq('couple_id', memberRes.data.couple_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    : Promise.resolve({ data: [] as Receipt[], error: null });

  const [itemsRes, completionsRes, clinicRes, receiptsRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', user.id)
      .gte('scheduled_at', since).order('scheduled_at', { ascending: false }),
    supabase.from('completion_records').select('*').eq('patient_id', user.id)
      .gte('completed_at', since).order('completed_at', { ascending: false }),
    supabase.from('clinic_updates').select('*').eq('patient_id', user.id)
      .gte('created_at', since).order('created_at', { ascending: false }),
    receiptsQuery,
  ]);

  if (itemsRes.error || completionsRes.error || clinicRes.error || receiptsRes.error) {
    return <RecordsScreen items={[]} completions={[]} clinicUpdates={[]} receipts={[]} />;
  }

  return (
    <RecordsScreen
      items={itemsRes.data ?? []}
      completions={completionsRes.data ?? []}
      clinicUpdates={clinicRes.data ?? []}
      receipts={receiptsRes.data ?? []}
    />
  );
}
