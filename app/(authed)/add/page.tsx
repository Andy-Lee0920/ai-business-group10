import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { ClinicUpdateForm } from '../../../src/features/clinic-update/clinic-update-form';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { fallbackMedications, fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import type { ScheduleItem } from '../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

export default async function AddPage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    return <ClinicUpdateForm mode="schedule" medications={fallbackMedications()} currentItems={fallbackScheduleItems('presentation-user')} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: medications, error } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, aliases, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_en', { ascending: true });
  const itemsRes = user
    ? await supabase
      .from('schedule_items')
      .select('id,type,title,scheduled_at,dose,unit,status')
      .eq('patient_id', user.id)
      .gte('scheduled_at', dayStart(0).toISOString())
      .lte('scheduled_at', dayEnd(2).toISOString())
      .order('scheduled_at', { ascending: true })
    : { data: [], error: null };
  const currentItems = user && !isMissingSlcTable(itemsRes.error)
    ? (itemsRes.data ?? []) as ScheduleItem[]
    : fallbackScheduleItems(user?.id ?? 'presentation-user');

  if (error) return <ClinicUpdateForm mode="schedule" medications={fallbackMedications()} currentItems={currentItems} />;
  return <ClinicUpdateForm mode="schedule" medications={medications ?? []} currentItems={currentItems} />;
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
