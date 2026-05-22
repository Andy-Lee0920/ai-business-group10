import type { IvfPhase } from '../../types/cycle-event.types';
import type { BriefFact, BriefPhase } from './types';

const baseline = (fact: string): BriefFact[] => [{ fact, cite: 'Fevio IVF care brief dictionary' }];

const phaseFacts: Record<IvfPhase, BriefFact[]> = {
  consultation: baseline('오늘은 병원 안내를 차분히 정리하고 다음 확인 항목을 준비하는 날이에요.'),
  period: baseline('생리 시작일은 이후 일정 계산의 기준이 되므로 날짜 확인이 중요해요.'),
  stimulation: baseline('과배란 주사 기간에는 정해진 시간과 약 이름 확인이 가장 중요해요.'),
  follicle_monitoring: baseline('난포 확인일에는 방문 시간과 병원에서 바뀐 안내를 다시 기록해요.'),
  trigger_wait: baseline('트리거 주사는 병원이 지정한 시간을 기준으로 준비 여부를 확인해요.'),
  retrieval_scheduled: baseline('채취 예정일에는 방문 시간과 금식 등 병원 안내를 먼저 확인해요.'),
  retrieval_done: baseline('채취 후에는 병원이 안내한 회복 기준과 다음 연락 일정을 확인해요.'),
  cycle_cancelled: baseline('일정이 중단된 날에는 병원이 안내한 다음 계획만 차분히 보관해요.'),
  stimulation_extended: baseline('주사 기간이 늘어난 경우 새 병원 안내가 이전 안내보다 우선해요.'),
  embryo_culture: baseline('배아 배양 기간에는 병원 연락 일정과 다음 방문 여부를 확인해요.'),
  freeze_all: baseline('동결 결정 후에는 다음 준비 시작일과 병원 연락 일정을 정리해요.'),
  frozen_transfer_wait: baseline('동결 이식 전 대기에는 다음 시작 조건과 방문 일정을 확인해요.'),
  frozen_transfer_preparation: baseline('이식 준비 기간에는 약 시간과 방문 일정을 함께 확인해요.'),
  transfer_scheduled: baseline('이식 예정일에는 방문 시간과 병원 준비 안내를 먼저 확인해요.'),
  two_week_wait: baseline('대기 기간에는 병원이 정한 검사일과 복약 안내를 유지해요.'),
  beta_wait: baseline('피검 예정일에는 검사 시간과 결과 확인 방식을 병원 안내대로 확인해요.'),
  beta_followup: baseline('재검이 필요한 경우 새 검사일과 병원 연락 안내를 우선해요.'),
  result_protection: baseline('결과 확인 후에는 병원이 안내한 다음 일정만 화면에 남겨요.'),
  ultrasound_wait: baseline('초음파 대기에는 예약일과 병원에서 안내한 주의사항을 확인해요.'),
  cycle_closed: baseline('이번 주기의 확정된 기록은 다음 상담 때 다시 볼 수 있게 보관돼요.'),
  next_cycle_planning: baseline('다음 주기를 준비할 때는 이전 병원 안내와 새 상담 일정을 분리해요.'),
};

export const factDict: Record<BriefPhase, BriefFact[]> = {
  onboarding: baseline('처음에는 병원 안내문을 넣으면 오늘 확인할 일정부터 정리해요.'),
  ...phaseFacts,
};
