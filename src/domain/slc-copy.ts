export const SLC_SAFE_COPY = {
  emptyRecords: '아직 기록이 없어요. 오늘 일정을 완료하면 이곳에 자동으로 정리됩니다.',
  noSchedule: '등록된 일정이 없어요. 병원 일정이나 투약 시간을 추가하면 오늘 할 일을 함께 볼 수 있어요.',
  medicationNotFound: '찾는 약이 없나요? 병원에서 들은 이름으로 직접 추가할 수 있어요.',
  saveFailed: '저장하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
  onboardingSaveFailed: '시작 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
  loadFailed: '정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
} as const;

const TECHNICAL_ERROR_PATTERN = /schema cache|public\.|user_profiles|clinic_updates|schedule_items|partner_links|Supabase|PostgREST|foreign key|violates|relation|column/i;

export function maskTechnicalError(message: unknown, fallback = SLC_SAFE_COPY.saveFailed): string {
  if (typeof message !== 'string' || !message.trim()) return fallback;
  if (TECHNICAL_ERROR_PATTERN.test(message)) return fallback;
  return fallback;
}
