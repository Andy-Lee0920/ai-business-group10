import { headers } from 'next/headers';
import { isPresentationRequest } from '../../config';
import { buildPresentationClinicUpdates, buildPresentationCompletions, buildPresentationItems } from '../presentation/presentation-testbed';
import { createCookieBackedSupabaseClient } from '../../lib/server-supabase';
import type { ClinicUpdate, CompletionRecord, ScheduleItem } from '../../types/mvp.types';

export type RecordsDataSource = { kind: 'fixture' } | { kind: 'supabase' };

export interface RecordsScreenLoaderProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates: ClinicUpdate[];
}

export async function resolveRecordsDataSource(): Promise<RecordsDataSource> {
  const requestHeaders = await headers();
  return isPresentationRequest({ headers: requestHeaders }) ? { kind: 'fixture' } : { kind: 'supabase' };
}

export async function loadRecordsScreenProps(source: RecordsDataSource): Promise<RecordsScreenLoaderProps> {
  if (source.kind === 'fixture') {
    return {
      items: buildPresentationItems(),
      completions: buildPresentationCompletions(),
      clinicUpdates: buildPresentationClinicUpdates(),
    };
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyRecordsProps();

  const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
  const [itemsRes, completionsRes, clinicRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', user.id)
      .gte('scheduled_at', since).order('scheduled_at', { ascending: false }),
    supabase.from('completion_records').select('*').eq('patient_id', user.id)
      .gte('completed_at', since).order('completed_at', { ascending: false }),
    supabase.from('clinic_updates').select('*').eq('patient_id', user.id)
      .gte('created_at', since).order('created_at', { ascending: false }),
  ]);

  if (itemsRes.error || completionsRes.error || clinicRes.error) return emptyRecordsProps();
  return {
    items: itemsRes.data ?? [],
    completions: completionsRes.data ?? [],
    clinicUpdates: clinicRes.data ?? [],
  };
}

function emptyRecordsProps(): RecordsScreenLoaderProps {
  return { items: [], completions: [], clinicUpdates: [] };
}
