import { describe, expect, it } from 'vitest';
import { DEMO_ORDER, DEMO_SCENARIOS } from '../../app/demo/demo-scenarios';
import { buildDemoExperienceGuide } from '../../app/demo/stage-experience';

describe('demo stage experience guide', () => {
  it('explains what changes on patient and partner screens for every IVF stage', () => {
    for (const stage of DEMO_ORDER) {
      const guide = buildDemoExperienceGuide(DEMO_SCENARIOS[stage]);
      expect(guide.stageId).toBe(stage);
      expect(guide.surfaceShift).toContain(DEMO_SCENARIOS[stage].shortLabel);
      expect(guide.patientDelta).not.toEqual(guide.partnerDelta);
      expect(guide.patientDelta.length).toBeGreaterThan(6);
      expect(guide.partnerDelta.length).toBeGreaterThan(6);
      expect(guide.proofPoints).toHaveLength(3);
    }
  });

  it('makes the injection stage visibly about execution while result stage is about protection', () => {
    const injection = buildDemoExperienceGuide(DEMO_SCENARIOS.ovarian_stimulation);
    expect(`${injection.surfaceShift} ${injection.patientDelta} ${injection.partnerDelta}`).toMatch(/주사|실행|준비/u);

    const result = buildDemoExperienceGuide(DEMO_SCENARIOS.pregnancy_test);
    expect(`${result.surfaceShift} ${result.patientDelta} ${result.partnerDelta}`).toMatch(/결과|공유|해석/u);
    expect(result.proofPoints.join(' ')).toContain('수치 해석하지 않기');
  });
});
