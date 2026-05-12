import { describe, expect, it } from 'vitest';
import {
  defaultSharingLevelByStage,
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

  it('keeps sensitive stages on basic sharing and collaborative stages on care sharing', () => {
    expect(defaultSharingLevelByStage('pregnancy_test')).toBe('basic');
    expect(defaultSharingLevelByStage('ovarian_stimulation')).toBe('care');
    expect(defaultSharingLevelByStage('fertilization')).toBe('basic');
  });
});
