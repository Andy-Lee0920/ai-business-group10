import { describe, expect, it } from 'vitest';
import { SLC_SAFE_COPY, maskTechnicalError } from '../../src/domain/slc-copy';
import { readFileSync } from 'node:fs';

const forbidden = ['schema cache', 'public.', 'user_profiles', 'clinic_updates', 'schedule_items', 'Supabase', 'PostgREST'];

describe('SLC user-safe copy contract', () => {
  it('masks technical backend errors before they can become UI copy', () => {
    const masked = maskTechnicalError('Could not find clinic_updates in the schema cache');
    expect(masked).toBe(SLC_SAFE_COPY.saveFailed);
    for (const word of forbidden) expect(masked).not.toContain(word);
  });

  it('keeps empty and save-failure copy calm and non-judgmental', () => {
    const copy = Object.values(SLC_SAFE_COPY).join('\n');
    expect(copy).toContain('아직 기록이 없어요');
    expect(SLC_SAFE_COPY.emptyRecords).toContain('오늘 일정을 완료하면 이곳에 자동으로 정리됩니다');
    expect(SLC_SAFE_COPY.noSchedule).toContain('병원 일정이나 투약 시간을 추가하면 오늘 할 일을 함께 볼 수 있어요');
    expect(SLC_SAFE_COPY.medicationNotFound).toContain('찾는 약이 없나요?');
    expect(SLC_SAFE_COPY.saveFailed).toContain('네트워크 상태를 확인한 뒤 다시 시도해주세요');
    expect(copy).not.toMatch(/schema cache|public\.|user_profiles|clinic_updates|schedule_items|공포|두려움|판단하세요/);
  });

  it('masks onboarding API persistence errors instead of returning backend messages', () => {
    const route = readFileSync('app/api/onboarding/route.ts', 'utf8');
    expect(route).toContain('maskTechnicalError(profileError.message)');
    expect(route).toContain('maskTechnicalError(consentError.message)');
    expect(route).toContain('maskTechnicalError(updateError.message)');
    expect(route).toContain('maskTechnicalError(scheduleError.message)');
  });
});
