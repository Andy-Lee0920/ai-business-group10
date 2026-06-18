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
    item(patientId, 1, 'clinic', '[테스트] 초음파/채혈 확인', null, null, '2026-06-17T09:30:00+09:00', createdAt, 'completed'),
    item(patientId, 2, 'injection', '[테스트] 고날에프 주사', '150', 'IU', '2026-06-17T21:00:00+09:00', createdAt, 'completed'),
    item(patientId, 3, 'clinic', '[테스트] 병원 진료 방문', null, null, '2026-06-18T13:30:00+09:00', createdAt, 'completed'),
    item(patientId, 4, 'clinic', '[테스트] 내일 초음파/채혈 방문', null, null, '2026-06-19T09:30:00+09:00', createdAt),
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
      body: '실패했을 때 단순한 말로만 위로했던 것\n시술 실패로 낙담했을 당시에는 잘 몰라서 "다음에 잘 될 거야"라는 상투적인 말밖에 해주지 못했던 것을 후회합니다. 과거로 돌아간다면 아내와 함께 맛있는 것도 먹으러 가고, 가고 싶어 했던 여행도 다니며 서로를 적극적으로 위로하며 시간을 보냈을 것이라 고백합니다.',
      mood: 'hopeful',
      painScore: null,
      photoUrls: [],
      authorRole: 'partner',
      createdAt: '2026-06-18T20:30:00+09:00',
    },
    {
      id: 'june-test-journal-2',
      body: '시술 과정을 옆에서 지켜보기만 했던 것\n병원 다닐 때 진료 내용을 기록하거나 주사를 맞는 등의 과정을 아내 혼자 감당하게 하고 옆에서 지켜보기만 했던 것을 미안해합니다. 다시 돌아간다면 챙겨야 할 모든 것들을 남편 본인이 직접 다 해주고 싶다고 말합니다.',
      mood: 'worried',
      painScore: null,
      photoUrls: [],
      authorRole: 'partner',
      createdAt: '2026-06-18T19:40:00+09:00',
    },
    {
      id: 'june-test-journal-1',
      body: '감정 기복을 더 밝은 표정으로 받아주지 못한 것\n호르몬 주사 등으로 인해 아내의 감정 기복이 심했을 때, 더 넓은 마음과 밝은 표정으로 아내의 감정을 다 받아주지 못했던 점을 후회하고 있습니다.',
      mood: 'calm',
      painScore: null,
      photoUrls: [],
      authorRole: 'partner',
      createdAt: '2026-06-18T19:00:00+09:00',
    },
  ];
}

function juneTestCommunityPosts(): CommunityPostListItem[] {
  return [
    {
      id: 'june-test-community-2',
      body: '진료 내용 기록, 주사 시간 확인, 방문 준비를 옆에서 보기만 하지 않고 같이 맡아주는 장면을 남겼어요.',
      mood: 'calm',
      subCategory: 'tip',
      photoUrls: ['/assets/slc/partner-reflection-record.png'],
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
      body: '단순한 위로보다 함께 기록하고, 같이 쉬고, 다음 시간을 같이 챙기는 방식이 더 도움이 됐다는 기록입니다.',
      mood: null,
      subCategory: 'today',
      photoUrls: ['/assets/slc/partner-reflection-record.png'],
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
  status: ScheduleItem['status'] = 'upcoming',
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
    status,
    source: 'manual',
    created_at: createdAt,
  };
}
