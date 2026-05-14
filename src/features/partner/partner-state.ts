export type PartnerProjectionState = 'not_linked' | 'requested' | 'linked_no_schedule' | 'linked_with_schedule';

const COPY: Record<PartnerProjectionState, { title: string; description: string }> = {
  not_linked: {
    title: '아직 연결된 치료자가 없어요',
    description: '초대 링크로 연결 요청을 보내고 치료자가 승인하면 오늘 상태를 읽기 전용으로 볼 수 있어요.',
  },
  requested: {
    title: '승인 대기 중',
    description: '치료자가 요청을 승인하면 오늘 일정과 완료 상태가 열립니다. 승인 후 이 화면을 새로고침해서 확인해 주세요.',
  },
  linked_no_schedule: {
    title: '오늘은 확인만 하면 됩니다',
    description: '공유된 오늘 일정이 없어요. 새 일정이 생기면 이 화면에 표시됩니다.',
  },
  linked_with_schedule: {
    title: '오늘 상황',
    description: '치료자가 공유한 오늘 일정과 완료 상태만 읽기 전용으로 보여줍니다.',
  },
};

export function partnerStateCopy(state: PartnerProjectionState): { title: string; description: string } {
  return COPY[state];
}
