import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { ManualAddForm } from '../../../src/features/add/manual-add-form';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { fallbackMedications } from '../../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function AddPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    return <ManualAddForm medications={fallbackMedications()} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: medications, error } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, aliases, category, route, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_en', { ascending: true });

  if (error) return <ManualAddForm medications={fallbackMedications()} />;
  return <ManualAddForm medications={medications ?? []} />;
}
