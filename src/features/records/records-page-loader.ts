import { headers } from 'next/headers';
import { isPresentationRequest } from '../../config';
import { buildPresentationClinicUpdates, buildPresentationCompletions, buildPresentationItems } from '../presentation/presentation-testbed';
import { createCookieBackedSupabaseClient } from '../../lib/server-supabase';
import type { ClinicUpdate, CompletionRecord, ScheduleItem } from '../../types/mvp.types';
import type { CoupleJournalEntry } from '../../types/journal.types';
import type { CommunityActorRole, CommunityAudience, CommunityAudienceScope, CommunityPostListItem } from '../../types/community.types';

export type RecordsDataSource = { kind: 'fixture' } | { kind: 'supabase' };

export interface RecordsScreenLoaderProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates: ClinicUpdate[];
  journalEntries: CoupleJournalEntry[];
  communityPosts: CommunityPostListItem[];
  communityAudience: CommunityAudience;
  actorRole: CommunityActorRole;
  isPartnerLinked: boolean;
  coupleId: string | null;
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
          audienceScope: 'everyone',
          audienceRole: null,
          moderationStatus: 'approved',
          isOfficial: true,
          createdAt: new Date().toISOString(),
        },
      ],
      communityAudience: 'primary_feed',
      actorRole: 'primary',
      isPartnerLinked: true,
      coupleId: 'fixture-couple',
    };
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyRecordsProps();

  const actor = await resolveActor(supabase, user.id);
  const communityAudience: CommunityAudience = actor?.role === 'partner' ? 'partner_feed' : 'primary_feed';
  const actorRole: CommunityActorRole = actor?.role ?? 'primary';
  const isPartnerLinked = actor ? await hasApprovedPartnerLink(supabase, actor.couple_id) : false;
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
    supabase.from('community_posts').select('id, body, mood, sub_category, audience, audience_scope, audience_role, moderation_status, is_official, created_at, community_identities(nickname)')
      .is('deleted_at', null).order('is_official', { ascending: false }).order('created_at', { ascending: false }),
  ]);

  if (itemsRes.error || completionsRes.error || clinicRes.error || journalRes.error || communityRes.error) return emptyRecordsProps(communityAudience);
  return {
    items: itemsRes.data ?? [],
    completions: completionsRes.data ?? [],
    clinicUpdates: clinicRes.data ?? [],
    journalEntries: (journalRes.data ?? []).map(toJournalEntry),
    communityPosts: (communityRes.data ?? []).map(toCommunityPost),
    communityAudience,
    actorRole,
    isPartnerLinked,
    coupleId: actor?.couple_id ?? null,
  };
}

function emptyRecordsProps(communityAudience: CommunityAudience = 'primary_feed'): RecordsScreenLoaderProps {
  return { items: [], completions: [], clinicUpdates: [], journalEntries: [], communityPosts: [], communityAudience, actorRole: communityAudience === 'partner_feed' ? 'partner' : 'primary', isPartnerLinked: false, coupleId: null };
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

async function hasApprovedPartnerLink(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  coupleId: string,
) {
  const { data: primaryMember } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId)
    .eq('role', 'primary')
    .limit(1)
    .maybeSingle();
  const primaryUserId = typeof primaryMember?.user_id === 'string' ? primaryMember.user_id : null;
  if (!primaryUserId) return false;
  const { data, error } = await supabase
    .from('partner_links')
    .select('id')
    .eq('patient_id', primaryUserId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();
  return !error && Boolean(data?.id);
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
  const audienceScope = normalizeAudienceScope(row.audience_scope);
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood : null,
    subCategory: isCommunitySubCategory(row.sub_category) ? row.sub_category : 'today',
    audience: row.audience === 'partner_feed' ? 'partner_feed' : 'primary_feed',
    audienceScope,
    audienceRole: row.audience_role === 'primary' || row.audience_role === 'partner' ? row.audience_role : null,
    moderationStatus: row.moderation_status === 'approved' || row.moderation_status === 'rejected' ? row.moderation_status : 'pending',
    isOfficial: row.is_official === true,
    createdAt: String(row.created_at),
    authorNickname: extractCommunityNickname(row.community_identities),
  };
}

function normalizeAudienceScope(value: unknown): CommunityAudienceScope {
  return value === 'same_role' ? 'same_role' : 'everyone';
}

function extractCommunityNickname(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0] as { nickname?: unknown } | undefined;
    return typeof first?.nickname === 'string' ? first.nickname : null;
  }
  if (value && typeof value === 'object' && 'nickname' in value) {
    const nickname = (value as { nickname?: unknown }).nickname;
    return typeof nickname === 'string' ? nickname : null;
  }
  return null;
}

function isCommunitySubCategory(value: unknown): value is CommunityPostListItem['subCategory'] {
  return value === 'pain' || value === 'worry' || value === 'today' || value === 'tip';
}
