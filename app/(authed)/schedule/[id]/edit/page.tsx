import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ScheduleEditForm } from '../../../../../src/features/schedule/schedule-edit-form';
import { isPresentationRequest } from '../../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
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

  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('id', id)
    .eq('patient_id', user.id)
    .maybeSingle<ScheduleItem>();

  if (error || !data) notFound();
  return <ScheduleEditForm item={data} />;
}
