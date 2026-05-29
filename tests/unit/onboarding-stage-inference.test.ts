import { describe, expect, it } from 'vitest';
import {
  buildInitialCareCycleState,
  careDayForOnboardingStage,
  defaultSharingLevelByStage,
  explainIvfStage,
  explainTreatmentMilestone,
  getEffectiveStage,
  inferStageFromCareItem,
} from '../../src/domain/onboarding-care-state';

describe('onboarding care state inference', () => {
  it('infers ovarian stimulation with high confidence for injection medication copy', () => {
    expect(inferStageFromCareItem({ selectedIntent: 'medication', rawText: '밤에 주사' })).toMatchObject({
      inferredStage: 'ovarian_stimulation',
      confidence: 'high',
    });
  });

  it('keeps result waiting intentionally medium confidence', () => {
    expect(inferStageFromCareItem({ selectedIntent: 'result_waiting', rawText: '결과 연락 기다리는 중' })).toMatchObject({
      inferredStage: 'embryo_culture',
      confidence: 'medium',
    });
  });

  it('falls back to baseline testing when the user is unsure', () => {
    expect(inferStageFromCareItem({ selectedIntent: 'unknown' })).toMatchObject({
      inferredStage: 'baseline_testing',
      confidence: 'low',
    });
  });

  it('uses user corrected stage as the effective stage', () => {
    expect(getEffectiveStage({ inferredStage: 'embryo_culture', confidence: 'medium', reason: 'ambiguous_result_waiting', userCorrectedStage: 'pregnancy_test' })).toBe('pregnancy_test');
  });



  it('maps the confirmed/effective IVF stage to the first home care surface', () => {
    expect(careDayForOnboardingStage('ovarian_stimulation')).toBe('injection_day');
    expect(careDayForOnboardingStage('embryo_transfer')).toBe('two_week_wait_day');
    expect(careDayForOnboardingStage('pregnancy_test')).toBe('result_protection_day');
    expect(careDayForOnboardingStage('embryo_culture')).toBe('waiting_day');
    expect(careDayForOnboardingStage('baseline_testing')).toBe('clinic_day');
  });

  it('builds a saveable initial care cycle state from user-confirmed onboarding stage', () => {
    expect(buildInitialCareCycleState({
      cycleId: 'couple-1',
      inferredStage: 'ovarian_stimulation',
      effectiveStage: 'pregnancy_test',
      roleContext: 'primary_with_partner',
      sharingLevel: 'basic',
      partnerInvite: 'prepare_invite',
      firstCareItem: { selectedIntent: 'medication', rawText: '밤에 주사', medicalNotes: '', attachmentCount: 0 },
    })).toMatchObject({
      source: 'onboarding',
      version: 1,
      cycleId: 'couple-1',
      inferredStage: 'ovarian_stimulation',
      effectiveStage: 'pregnancy_test',
      stageUserCorrected: true,
      careDay: 'result_protection_day',
      roleContext: 'primary_with_partner',
      sharingLevel: 'basic',
      partnerInvite: 'prepare_invite',
    });
  });

  it('keeps sensitive stages on basic sharing and collaborative stages on care sharing', () => {
    expect(defaultSharingLevelByStage('pregnancy_test')).toBe('basic');
    expect(defaultSharingLevelByStage('ovarian_stimulation')).toBe('care');
    expect(defaultSharingLevelByStage('fertilization')).toBe('basic');
  });

  it('explains core IVF terms without medical prediction or treatment advice', () => {
    const retrieval = explainIvfStage('egg_retrieval');
    const culture = explainIvfStage('embryo_culture');
    const transfer = explainTreatmentMilestone('embryo_transfer');

    expect(retrieval.headline).toContain('난자');
    expect(culture.headline).toContain('배아 배양');
    expect(transfer.headline).toContain('배아 이식');
    expect(`${retrieval.boundary}\n${culture.boundary}\n${transfer.boundary}`).toMatch(/단정하지 않아요|해석하지 않아요|말하지 않아요/u);
    expect(`${retrieval.body}\n${culture.body}\n${transfer.body}`).not.toMatch(/성공 가능성|착상될|용량 변경/u);
  });
});
