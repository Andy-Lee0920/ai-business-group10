import { describe, expect, it } from 'vitest';
import { SLC_SAFE_COPY, maskTechnicalError } from '../../src/domain/slc-copy';

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
    expect(copy).not.toMatch(/schema cache|public\.|user_profiles|clinic_updates|schedule_items|공포|두려움|판단하세요/);
  });
});
