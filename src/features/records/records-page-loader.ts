import { headers } from 'next/headers';
import { isPresentationRequest } from '../../config';
import { buildPresentationClinicUpdates, buildPresentationCompletions, buildPresentationItems } from '../presentation/presentation-testbed';
import { createCookieBackedSupabaseClient } from '../../lib/server-supabase';
import type { ClinicUpdate, CompletionRecord, ScheduleItem } from '../../types/mvp.types';
import type { CoupleJournalEntry } from '../../types/journal.types';
import type { CommunityAudience, CommunityPostListItem } from '../../types/community.types';

export type RecordsDataSource = { kind: 'fixture' } | { kind: 'supabase' };

export interface RecordsScreenLoaderProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates: ClinicUpdate[];
  journalEntries: CoupleJournalEntry[];
  communityPosts: CommunityPostListItem[];
  communityAudience: CommunityAudience;
}

type CoupleMemberRow = { couple_id: string; role: 'primary' | 'partner' };

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
      journalEntries: [
        {
          id: 'fixture-journal-1',
          body: '오늘은 병원 안내를 같이 다시 확인했어요.',
          mood: 'calm',
          painScore: 1,
          photoUrls: [],
          authorRole: 'primary',
          createdAt: new Date().toISOString(),
        },
      ],
      communityPosts: [
        {
          id: 'fixture-community-1',
          body: '주사 시간은 알림과 병원 안내를 같이 확인하면 덜 헷갈렸어요.',
          mood: null,
          subCategory: 'tip',
          audience: 'primary_feed',
          moderationStatus: 'approved',
          isOfficial: true,
          createdAt: new Date().toISOString(),
        },
      ],
      communityAudience: 'primary_feed',
    };
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyRecordsProps();

  const actor = await resolveActor(supabase, user.id);
  const communityAudience: CommunityAudience = actor?.role === 'partner' ? 'partner_feed' : 'primary_feed';
  const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
  const [itemsRes, completionsRes, clinicRes, journalRes, communityRes] = await Promise.all([
    supabase.from('schedule_items').select('*').eq('patient_id', user.id)
      .gte('scheduled_at', since).order('scheduled_at', { ascending: false }),
    supabase.from('completion_records').select('*').eq('patient_id', user.id)
      .gte('completed_at', since).order('completed_at', { ascending: false }),
    supabase.from('clinic_updates').select('*').eq('patient_id', user.id)
      .gte('created_at', since).order('created_at', { ascending: false }),
    actor
      ? supabase.from('couple_journal_entries').select('id, body, mood, pain_score, photo_urls, author_role, created_at')
        .eq('couple_id', actor.couple_id).is('deleted_at', null).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from('community_posts').select('id, body, mood, sub_category, audience, moderation_status, is_official, created_at')
      .eq('audience', communityAudience).is('deleted_at', null).order('created_at', { ascending: false }),
  ]);

  if (itemsRes.error || completionsRes.error || clinicRes.error || journalRes.error || communityRes.error) return emptyRecordsProps(communityAudience);
  return {
    items: itemsRes.data ?? [],
    completions: completionsRes.data ?? [],
    clinicUpdates: clinicRes.data ?? [],
    journalEntries: (journalRes.data ?? []).map(toJournalEntry),
    communityPosts: (communityRes.data ?? []).map(toCommunityPost),
    communityAudience,
  };
}

function emptyRecordsProps(communityAudience: CommunityAudience = 'primary_feed'): RecordsScreenLoaderProps {
  return { items: [], completions: [], clinicUpdates: [], journalEntries: [], communityPosts: [], communityAudience };
}

async function resolveActor(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  userId: string,
): Promise<CoupleMemberRow | null> {
  const { data, error } = await supabase.from('couple_members').select('couple_id, role').eq('user_id', userId).limit(1).maybeSingle();
  if (error || !data) return null;
  const row = data as CoupleMemberRow;
  return row.role === 'primary' || row.role === 'partner' ? row : null;
}

function toJournalEntry(row: Record<string, unknown>): CoupleJournalEntry {
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood as CoupleJournalEntry['mood'] : null,
    painScore: typeof row.pain_score === 'number' ? row.pain_score : null,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls.filter((url): url is string => typeof url === 'string') : [],
    authorRole: row.author_role === 'partner' ? 'partner' : 'primary',
    createdAt: String(row.created_at),
  };
}

function toCommunityPost(row: Record<string, unknown>): CommunityPostListItem {
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood : null,
    subCategory: isCommunitySubCategory(row.sub_category) ? row.sub_category : 'today',
    audience: row.audience === 'partner_feed' ? 'partner_feed' : 'primary_feed',
    moderationStatus: row.moderation_status === 'approved' || row.moderation_status === 'rejected' ? row.moderation_status : 'pending',
    isOfficial: row.is_official === true,
    createdAt: String(row.created_at),
  };
}

function isCommunitySubCategory(value: unknown): value is CommunityPostListItem['subCategory'] {
  return value === 'pain' || value === 'worry' || value === 'today' || value === 'tip';
}
