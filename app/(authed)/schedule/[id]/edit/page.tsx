import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ScheduleEditForm } from '../../../../../src/features/schedule/schedule-edit-form';
import { isPresentationRequest } from '../../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../../../src/lib/slc-fallback';
import { CARE_ACTION_SCHEDULE_SELECT, projectCareActionCardForSchedule, type CareActionScheduleRow } from '../../../../../src/domain/care-action-home-projection';
import type { ScheduleItem } from '../../../../../src/types/slc.types';

export const dynamic = 'force-dynamic';

type EditSchedulePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const requestHeaders = await headers();
  if (isPresentationRequest({ headers: requestHeaders })) redirect('/calendar');

  const { id } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: careCard, error: careCardError } = await supabase
    .from('care_action_cards')
    .select(CARE_ACTION_SCHEDULE_SELECT)
    .eq('id', id)
    .eq('created_by', user.id)
    .maybeSingle<CareActionScheduleRow>();

  const projectedCareCard = careCard ? projectCareActionCardForSchedule(careCard) : null;
  if (projectedCareCard) return <ScheduleEditForm item={projectedCareCard} />;
  if (careCardError && !isMissingSlcTable(careCardError)) notFound();

  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('id', id)
    .eq('patient_id', user.id)
    .maybeSingle<ScheduleItem>();

  if (error || !data) notFound();
  return <ScheduleEditForm item={data} />;
}
