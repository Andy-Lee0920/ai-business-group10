import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { RecordsScreen } from '../../../src/features/records/records-screen';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { buildPresentationClinicUpdates, buildPresentationCompletions, buildPresentationItems } from '../../../src/features/presentation/presentation-testbed';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    return (
      <RecordsScreen
        items={buildPresentationItems()}
        completions={buildPresentationCompletions()}
        clinicUpdates={buildPresentationClinicUpdates()}
      />
    );
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [itemsRes, completionsRes, clinicRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', user.id)
      .gte('scheduled_at', since).order('scheduled_at', { ascending: false }),
    supabase.from('completion_records').select('*').eq('patient_id', user.id)
      .gte('completed_at', since).order('completed_at', { ascending: false }),
    supabase.from('clinic_updates').select('*').eq('patient_id', user.id)
      .gte('created_at', since).order('created_at', { ascending: false }),
  ]);

  if (itemsRes.error || completionsRes.error || clinicRes.error) {
    return <RecordsScreen items={[]} completions={[]} clinicUpdates={[]} />;
  }

  return <RecordsScreen items={itemsRes.data ?? []} completions={completionsRes.data ?? []} clinicUpdates={clinicRes.data ?? []} />;
}
