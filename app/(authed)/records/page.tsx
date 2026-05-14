import { RecordsScreen } from '../../../src/features/records/records-screen';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [itemsRes, completionsRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', user.id)
      .gte('scheduled_at', since).order('scheduled_at', { ascending: false }),
    supabase.from('completion_records').select('*').eq('patient_id', user.id)
      .gte('completed_at', since).order('completed_at', { ascending: false }),
  ]);

  if (itemsRes.error || completionsRes.error) {
    if (isMissingSlcTable(itemsRes.error) || isMissingSlcTable(completionsRes.error)) {
      return <RecordsScreen items={[]} completions={[]} />;
    }
    if (itemsRes.error) throw new Error(itemsRes.error.message);
    if (completionsRes.error) throw new Error(completionsRes.error.message);
  }

  return <RecordsScreen items={itemsRes.data ?? []} completions={completionsRes.data ?? []} />;
}
