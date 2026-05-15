import { describe, expect, it } from 'vitest';
import {
  buildFirstScheduleDraft,
  FIRST_SCHEDULE_CHIPS,
  hasRequiredConsentChecks,
  nextOnboardingStep,
  ONBOARDING_CONSENT_CHECKS,
  type ConsentCheckKey,
} from '../../src/features/onboarding/onboarding-flow';

describe('Session A onboarding flow contract', () => {
  it('moves through brand intro, role, consent, first schedule, confirm, and home without legacy onboarding states', () => {
    expect(nextOnboardingStep('brand_intro')).toBe('role_selection');
    expect(nextOnboardingStep('role_selection', 'patient')).toBe('patient_consent');
    expect(nextOnboardingStep('patient_consent', 'patient')).toBe('first_schedule_interview');
    expect(nextOnboardingStep('first_schedule_interview', 'patient')).toBe('first_schedule_confirm');
    expect(nextOnboardingStep('first_schedule_confirm', 'patient')).toBe('home');
    expect(nextOnboardingStep('role_selection', 'partner')).toBe('partner_consent');
  });

  it('requires four explicit consent checks before sensitive onboarding writes', () => {
    const keys = ONBOARDING_CONSENT_CHECKS.map((item) => item.key);
    expect(keys).toEqual(['privacy_boundary', 'sensitive_data', 'clinical_boundary', 'input_assist_boundary']);
    expect(hasRequiredConsentChecks({ privacy_boundary: true, sensitive_data: true, clinical_boundary: true })).toBe(false);
    expect(hasRequiredConsentChecks(Object.fromEntries(keys.map((key) => [key, true])) as Record<ConsentCheckKey, boolean>)).toBe(true);
  });

  it('builds only user-confirmed first schedule drafts with onboarding_interview source', () => {
    expect(FIRST_SCHEDULE_CHIPS.map((chip) => chip.id)).toEqual(['injection', 'medication', 'clinic']);

    const draft = buildFirstScheduleDraft({
      chipId: 'injection',
      title: '고날에프 주사',
      scheduledAt: '2026-05-15T12:00:00.000Z',
      dose: '150',
      unit: 'IU',
      optionalMemo: '병원 안내문 그대로 입력',
      matchedMedication: { id: 'gonal-f', brand_name_ko: '고날에프' },
      assistSource: 'aliases',
    });

    expect(draft).toMatchObject({
      type: 'injection',
      title: '고날에프 주사',
      source: 'onboarding_interview',
      medicationId: 'gonal-f',
      optionalMemo: '병원 안내문 그대로 입력',
      inputAssist: { source: 'aliases', requiresUserConfirmation: true },
    });
    expect(buildFirstScheduleDraft({ chipId: 'clinic', title: '', scheduledAt: '2026-05-15T12:00:00.000Z' })).toBeNull();
  });
});
