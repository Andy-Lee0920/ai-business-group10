export type RecordsTab = 'journal' | 'community';

export interface RecordsActivityInput {
  journalEntries: readonly unknown[];
  communityPosts: readonly unknown[];
}

export const RECORDS_SURFACE_COPY = {
  header: {
    eyebrow: '함께 남기는 기록',
    title: '기록',
    lead(activityCount: number) {
      return `커플저널과 공유 기록을 한 화면에서 전환해요. 최근 기록 ${activityCount}건`;
    },
  },
  tabs: {
    journal: '커플저널',
    community: '공유 기록',
  },
  journal: {
    sectionLabel: '커플저널',
    lockedTitle: '파트너 연결 후 둘만의 기록을 시작할 수 있어요',
    lockedBody: '커플저널은 둘만 보는 공간이라서 파트너 연결이 완료된 뒤 작성할 수 있어요. 기존 기록은 연결 상태가 바뀌어도 보존됩니다.',
    inviteCta: '파트너 초대하기',
    title: '둘만의 기록',
    body(upcomingCount: number) {
      return `남은 일정 ${upcomingCount}개를 보며 오늘의 기분과 사진을 함께 남깁니다.`;
    },
    fieldBody: '오늘 기록',
    bodyPlaceholder: '오늘 병원 안내를 어떻게 확인했나요?',
    moodField: '기분',
    painField: '통증 점수',
    photoField: '사진',
    submit: '부부간 기록 남기기',
    saving: '저장 중',
    emptyLinked: '둘만의 첫 기록을 남겨보세요.',
    emptyLocked: '파트너 연결 후 기록을 남길 수 있어요.',
  },
  community: {
    sectionLabel: '공유 기록',
    title: '사진으로 남기는 확인 기록',
    body: '안내문 원본 대신 개인정보를 지운 사진과 짧은 캡션으로, 나중에 다시 보기 좋은 카드처럼 남겨요.',
    composeCta: '사진과 함께 남기기',
    closeComposerLabel: '공유 기록 작성 닫기',
    composerTitle: '공유 기록 만들기',
    bodyPlaceholder: '짧은 캡션을 남겨주세요. 예: 주사 시간은 알림과 병원 안내를 같이 맞췄어요.',
    photoField: '사진',
    photoCta: '사진 선택',
    photoHint: '개인정보, 병원명, 처방지 원본이 보이는 사진은 올리지 마세요.',
    photoUploadFailed: '사진 저장 공간을 확인하지 못했어요. 잠시 후 다시 시도해주세요.',
    audienceField: '공개 범위',
    categoryField: '주제',
    helper: '사진과 글은 검수 후 공개돼요. 직접 확인한 일정·시간·준비물만 남겨주세요.',
    submit: '올리기',
    saving: '등록 중',
    cancel: '취소',
    emptyTitle: '아직 사진 기록이 없어요',
    emptyBody: '개인정보를 가린 사진과 짧은 캡션으로, 다시 보기 좋은 확인 기록을 남겨보세요.',
    promptLabel: '공유 기록 글감 예시',
    commentFallbackAuthor: '공유 기록',
    commentPending: '댓글 검수 중',
    commentLabel: '댓글',
  },
} as const;

export function countRecordsActivity({ journalEntries, communityPosts }: RecordsActivityInput) {
  return journalEntries.length + communityPosts.length;
}

export function defaultRecordsTab(isPartnerLinked: boolean): RecordsTab {
  return isPartnerLinked ? 'journal' : 'community';
}
