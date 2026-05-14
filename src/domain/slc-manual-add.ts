import type { ScheduleType } from '../types/slc.types';

export interface ManualAddTypeConfig {
  type: ScheduleType;
  label: string;
  titleLabel: string;
  titlePlaceholder: string;
  timeLabel: string;
  showMedicationSelect: boolean;
  showDose: boolean;
  doseLabel: string;
  defaultUnit: string;
}

export const MANUAL_ADD_TYPE_CONFIG: Record<ScheduleType, ManualAddTypeConfig> = {
  injection: {
    type: 'injection',
    label: '주사',
    titleLabel: '주사 이름',
    titlePlaceholder: '고날에프 / 오비드렐',
    timeLabel: '주사 날짜 · 시간',
    showMedicationSelect: true,
    showDose: true,
    doseLabel: '용량 (선택)',
    defaultUnit: 'IU',
  },
  medication: {
    type: 'medication',
    label: '복용약',
    titleLabel: '복용약 이름',
    titlePlaceholder: '듀파스톤 / 엽산',
    timeLabel: '복용 날짜 · 시간',
    showMedicationSelect: true,
    showDose: true,
    doseLabel: '복용량 (선택)',
    defaultUnit: '정',
  },
  clinic: {
    type: 'clinic',
    label: '병원',
    titleLabel: '방문 목적',
    titlePlaceholder: '난포 확인 / 피검사 / 진료',
    timeLabel: '방문 날짜 · 시간',
    showMedicationSelect: false,
    showDose: false,
    doseLabel: '',
    defaultUnit: '',
  },
};

export function manualAddConfigFor(type: ScheduleType): ManualAddTypeConfig {
  return MANUAL_ADD_TYPE_CONFIG[type];
}
