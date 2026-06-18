import type { ScheduleItem } from '../types/slc.types';
import type { CommunityPostListItem } from '../types/community.types';
import type { CoupleJournalEntry } from '../types/journal.types';

export const FEVIO_JUNE_TEST_SEED_COOKIE = 'fevio_test_seed_june_2026';

export function isJuneTestScheduleSeedEnabled(cookieValue: string | undefined) {
  return cookieValue === '1';
}

export function juneTestScheduleItems(patientId: string): ScheduleItem[] {
  const createdAt = '2026-06-17T00:00:00.000+09:00';
  return [
    item(patientId, 1, 'clinic', '[테스트] 초음파/채혈 확인', null, null, '2026-06-17T09:30:00+09:00', createdAt),
    item(patientId, 2, 'injection', '[테스트] 고날에프 주사', '150', 'IU', '2026-06-17T21:00:00+09:00', createdAt),
    item(patientId, 3, 'clinic', '[테스트] 병원 진료 방문', null, null, '2026-06-18T13:30:00+09:00', createdAt),
    item(patientId, 4, 'clinic', '[테스트] 난포 확인 방문', null, null, '2026-06-19T09:30:00+09:00', createdAt),
    item(patientId, 5, 'injection', '[테스트] 오비드렐 트리거 확인', '250', 'μg', '2026-06-19T22:00:00+09:00', createdAt),
    item(patientId, 6, 'clinic', '[테스트] 채혈/시술 전 확인', null, null, '2026-06-20T09:00:00+09:00', createdAt),
    item(patientId, 7, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-20T21:00:00+09:00', createdAt),
    item(patientId, 8, 'clinic', '[테스트] 시술/경과 확인', null, null, '2026-06-21T09:30:00+09:00', createdAt),
    item(patientId, 9, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-22T09:00:00+09:00', createdAt),
    item(patientId, 10, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-23T09:00:00+09:00', createdAt),
    item(patientId, 11, 'clinic', '[테스트] 다음 확인 방문', null, null, '2026-06-24T09:30:00+09:00', createdAt),
    item(patientId, 12, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-25T09:00:00+09:00', createdAt),
  ];
}

export function mergeJuneTestScheduleItems(items: ScheduleItem[], patientId: string, enabled: boolean) {
  if (!enabled) return items;
  const merged = [...items, ...juneTestScheduleItems(patientId)];
  return merged.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
}

export function mergeJuneTestJournalEntries(entries: CoupleJournalEntry[], enabled: boolean): CoupleJournalEntry[] {
  if (!enabled) return entries;
  return [...juneTestJournalEntries(), ...entries];
}

export function mergeJuneTestCommunityPosts(posts: CommunityPostListItem[], enabled: boolean): CommunityPostListItem[] {
  if (!enabled) return posts;
  return [...juneTestCommunityPosts(), ...posts];
}

function juneTestJournalEntries(): CoupleJournalEntry[] {
  return [
    {
      id: 'june-test-journal-3',
      body: '13:30 병원 진료 방문을 같이 확인했고, 알림 울리기 전에 준비물을 꺼내뒀어요.',
      mood: 'calm',
      painScore: 1,
      photoUrls: [],
      authorRole: 'primary',
      createdAt: '2026-06-18T13:45:00+09:00',
    },
    {
      id: 'june-test-journal-2',
      body: '옆에서 타이머만 같이 봤고, 다음 방문 시간은 캘린더에서 다시 확인했어요.',
      mood: 'hopeful',
      painScore: null,
      photoUrls: [],
      authorRole: 'partner',
      createdAt: '2026-06-18T14:10:00+09:00',
    },
    {
      id: 'june-test-journal-1',
      body: '초음파/채혈 후 안내를 캘린더에 같이 정리했어요.',
      mood: 'tired',
      painScore: 2,
      photoUrls: [],
      authorRole: 'primary',
      createdAt: '2026-06-17T11:20:00+09:00',
    },
  ];
}

function juneTestCommunityPosts(): CommunityPostListItem[] {
  return [
    {
      id: 'june-test-community-2',
      body: '병원 방문 시간은 안내문과 앱 알림을 같이 맞춰두니 훨씬 덜 헷갈렸어요.',
      mood: 'calm',
      subCategory: 'tip',
      photoUrls: ['/assets/slc/clinic-update-banner.png'],
      audience: 'primary_feed',
      audienceScope: 'everyone',
      audienceRole: null,
      moderationStatus: 'approved',
      isOfficial: false,
      createdAt: '2026-06-18T14:30:00+09:00',
      authorNickname: '테스트 기록',
    },
    {
      id: 'june-test-community-1',
      body: '개인정보가 보이는 원문 대신, 확인한 시간과 준비물만 짧게 남겼어요.',
      mood: null,
      subCategory: 'today',
      photoUrls: ['/assets/slc/clinic-update-banner.png'],
      audience: 'primary_feed',
      audienceScope: 'same_role',
      audienceRole: 'primary',
      moderationStatus: 'approved',
      isOfficial: true,
      createdAt: '2026-06-17T18:20:00+09:00',
      authorNickname: 'Fevio',
    },
  ];
}

function item(
  patientId: string,
  index: number,
  type: ScheduleItem['type'],
  title: string,
  dose: string | null,
  unit: string | null,
  scheduledAt: string,
  createdAt: string,
): ScheduleItem {
  return {
    id: `june-test-seed-2026-${index}`,
    patient_id: patientId,
    medication_id: null,
    type,
    title,
    dose,
    unit,
    scheduled_at: scheduledAt,
    status: 'upcoming',
    source: 'manual',
    created_at: createdAt,
  };
}
