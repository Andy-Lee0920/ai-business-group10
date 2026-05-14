import { isPresentationMode } from '../../../src/config';
import { ClinicUpdateForm } from '../../../src/features/clinic-update/clinic-update-form';
import { hasSupabasePublicConfig } from '../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { fallbackMedications } from '../../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function ClinicUpdatePage() {
  if (isPresentationMode() && !hasSupabasePublicConfig()) {
    return <ClinicUpdateForm medications={fallbackMedications()} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: medications, error } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, aliases, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_en', { ascending: true });
  const { data: partnerLinks } = user
    ? await supabase
      .from('partner_links')
      .select('id,status')
      .eq('patient_id', user.id)
      .in('status', ['requested', 'approved'])
    : { data: [] };

  if (error) return <ClinicUpdateForm medications={fallbackMedications()} partnerConnected={Boolean(partnerLinks?.length)} />;
  return <ClinicUpdateForm medications={medications ?? []} partnerConnected={Boolean(partnerLinks?.length)} />;
}
