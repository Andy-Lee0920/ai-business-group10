import { headers } from 'next/headers';
import { isPresentationRequest } from '../../../src/config';
import { ClinicUpdateForm } from '../../../src/features/clinic-update/clinic-update-form';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { ScheduleItem } from '../../../src/types/slc.types';
import { fallbackMedications, fallbackScheduleItems, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { CARE_ACTION_SCHEDULE_SELECT, mergeCanonicalScheduleItemsWithLegacyFallback, projectCareActionCardsForSchedule, type CareActionScheduleRow } from '../../../src/domain/care-action-home-projection';

export const dynamic = 'force-dynamic';

export default async function ClinicUpdatePage() {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) {
    return <ClinicUpdateForm mode="memo" medications={fallbackMedications()} currentItems={fallbackScheduleItems('presentation-user')} />;
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: medications, error } = await supabase
    .from('medications')
    .select('id, brand_name_ko, brand_name_en, aliases, default_unit, default_cta')
    .eq('is_slc_seed', true)
    .order('brand_name_en', { ascending: true });
  const [{ data: partnerLinks }, careCardsRes, itemsRes] = await Promise.all([
    user
      ? supabase
        .from('partner_links')
        .select('id,status')
        .eq('patient_id', user.id)
        .in('status', ['requested', 'approved'])
      : Promise.resolve({ data: [] }),
    user
      ? supabase
        .from('care_action_cards')
        .select(CARE_ACTION_SCHEDULE_SELECT)
        .eq('created_by', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('scheduled_at', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [], error: null }),
    user
      ? supabase
        .from('schedule_items')
        .select('id,patient_id,medication_id,type,title,scheduled_at,dose,unit,status,source,created_at')
        .eq('patient_id', user.id)
        .gte('scheduled_at', dayStart(0).toISOString())
        .lte('scheduled_at', dayEnd(2).toISOString())
        .order('scheduled_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const partnerConnected = partnerLinks?.some((link) => link.status === 'approved') === true;
  const careCardItems = user && !careCardsRes.error
    ? projectCareActionCardsForSchedule((careCardsRes.data ?? []) as CareActionScheduleRow[]).filter((item) => isWithinRange(item.scheduled_at, dayStart(0), dayEnd(2)))
    : [];
  const currentItems = user && !isMissingSlcTable(itemsRes.error)
    ? mergeCanonicalScheduleItemsWithLegacyFallback(careCardItems, (itemsRes.data ?? []) as ScheduleItem[])
    : (careCardItems.length > 0 ? careCardItems : fallbackScheduleItems(user?.id ?? 'presentation-user'));

  if (error) return <ClinicUpdateForm mode="memo" medications={fallbackMedications()} partnerConnected={partnerConnected} currentItems={currentItems} />;
  return <ClinicUpdateForm mode="memo" medications={medications ?? []} partnerConnected={partnerConnected} currentItems={currentItems} />;
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

function isWithinRange(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}
