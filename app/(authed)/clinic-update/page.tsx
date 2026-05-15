import { isPresentationMode } from '../../../src/config';
import { ClinicUpdateForm } from '../../../src/features/clinic-update/clinic-update-form';
import { hasSupabasePublicConfig } from '../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { ScheduleItem } from '../../../src/types/slc.types';
import { fallbackMedications, fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';

export const dynamic = 'force-dynamic';

export default async function ClinicUpdatePage() {
  if (isPresentationMode() && !hasSupabasePublicConfig()) {
    return <ClinicUpdateForm medications={fallbackMedications()} currentItems={fallbackScheduleItems('presentation-user')} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: medications, error } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, aliases, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_en', { ascending: true });
  const [{ data: partnerLinks }, itemsRes] = await Promise.all([
    user
      ? supabase
        .from('partner_links')
        .select('id,status')
        .eq('patient_id', user.id)
        .in('status', ['requested', 'approved'])
      : Promise.resolve({ data: [] }),
    user
      ? supabase
        .from('schedule_items')
        .select('id,type,title,scheduled_at,dose,unit,status')
        .eq('patient_id', user.id)
        .gte('scheduled_at', dayStart(0).toISOString())
        .lte('scheduled_at', dayEnd(2).toISOString())
        .order('scheduled_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const partnerConnected = partnerLinks?.some((link) => link.status === 'approved') === true;
  const currentItems = user && !isMissingSlcTable(itemsRes.error) ? (itemsRes.data ?? []) as ScheduleItem[] : fallbackScheduleItems(user?.id ?? 'presentation-user');

  if (error) return <ClinicUpdateForm medications={fallbackMedications()} partnerConnected={partnerConnected} currentItems={currentItems} />;
  return <ClinicUpdateForm medications={medications ?? []} partnerConnected={partnerConnected} currentItems={currentItems} />;
}

function dayStart(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function dayEnd(offset: number) {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + offset);
  return date;
}
