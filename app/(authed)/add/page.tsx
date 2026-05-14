import { ManualAddForm } from '../../../src/features/add/manual-add-form';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { fallbackMedications, isMissingSlcTable } from '../../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function AddPage() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: medications, error } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_en', { ascending: true });

  if (error) {
    if (isMissingSlcTable(error)) return <ManualAddForm medications={fallbackMedications()} />;
    throw new Error(error.message);
  }
  return <ManualAddForm medications={medications ?? []} />;
}
