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
  unitOptions: string[];
}

export const MANUAL_ADD_TYPE_CONFIG: Record<ScheduleType, ManualAddTypeConfig> = {
  injection: {
    type: 'injection',
    label: '주사',
    titleLabel: '주사제 선택 또는 직접 입력',
    titlePlaceholder: '고날에프 / 오비드렐',
    timeLabel: '주사 날짜 · 시간',
    showMedicationSelect: true,
    showDose: true,
    doseLabel: '용량 (선택)',
    defaultUnit: 'IU',
    unitOptions: ['IU', 'μg', 'mg', 'ml', 'syringe'],
  },
  medication: {
    type: 'medication',
    label: '복용약',
    titleLabel: '복용약 선택 또는 직접 입력',
    titlePlaceholder: '듀파스톤 / 엽산',
    timeLabel: '복용 날짜 · 시간',
    showMedicationSelect: true,
    showDose: true,
    doseLabel: '복용량 (선택)',
    defaultUnit: '정',
    unitOptions: ['정', '개', 'mg', 'ml'],
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
    unitOptions: [],
  },
};

export function manualAddConfigFor(type: ScheduleType): ManualAddTypeConfig {
  return MANUAL_ADD_TYPE_CONFIG[type];
}

export interface ManualAddFormValue {
  type: ScheduleType;
  title: string;
  dose: string;
  unit: string;
  scheduledAt: string;
  medicationId: string;
}

export function buildManualAddPayload(form: ManualAddFormValue) {
  const config = manualAddConfigFor(form.type);
  return {
    type: form.type,
    title: form.title,
    dose: config.showDose && form.dose ? form.dose : null,
    unit: config.showDose && form.unit ? form.unit : null,
    scheduledAt: form.scheduledAt,
    medicationId: config.showMedicationSelect && form.medicationId ? form.medicationId : null,
  };
}
