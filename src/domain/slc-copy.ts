export const SLC_SAFE_COPY = {
  emptyRecords: '아직 기록이 없어요. 완료한 일정과 병원 변경 내용이 여기에 쌓입니다.',
  saveFailed: '저장하지 못했어요. 잠시 후 다시 시도해주세요.',
  onboardingSaveFailed: '시작 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
  loadFailed: '정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
} as const;

const TECHNICAL_ERROR_PATTERN = /schema cache|public\.|user_profiles|clinic_updates|schedule_items|partner_links|Supabase|PostgREST|foreign key|violates|relation|column/i;

export function maskTechnicalError(message: unknown, fallback = SLC_SAFE_COPY.saveFailed): string {
  if (typeof message !== 'string' || !message.trim()) return fallback;
  if (TECHNICAL_ERROR_PATTERN.test(message)) return fallback;
  return fallback;
}
