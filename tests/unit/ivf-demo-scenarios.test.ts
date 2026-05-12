import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEMO_ORDER, DEMO_SCENARIOS, IVF_STAGES, STAGE_INDEX_TO_ID, type IvfStage } from '../../app/demo/demo-scenarios';

const EXPECTED: IvfStage[] = [
  'baseline_testing',
  'ovarian_stimulation',
  'egg_retrieval',
  'fertilization',
  'embryo_culture',
  'embryo_transfer',
  'pregnancy_test',
];

describe('7-stage IVF demo scenarios', () => {
  it('defines seven IVF stages and numbered route mapping', () => {
    expect(DEMO_ORDER).toEqual(EXPECTED);
    expect(Object.values(STAGE_INDEX_TO_ID)).toEqual(EXPECTED);
    expect(IVF_STAGES).toHaveLength(7);
    expect(IVF_STAGES.map((stage) => stage.index)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const stage of IVF_STAGES) {
      expect(stage).toEqual(expect.objectContaining({ id: expect.any(String), label: expect.any(String), shortLabel: expect.any(String), description: expect.any(String), dominantMode: expect.any(String), accent: expect.stringMatching(/sage|coral|lavender/u) }));
    }
  });

  it('has complete patient and partner utility content for every stage', () => {
    expect(Object.keys(DEMO_SCENARIOS).sort()).toEqual([...EXPECTED].sort());
    for (const stage of EXPECTED) {
      const scenario = DEMO_SCENARIOS[stage];
      expect(scenario.stage).toBe(stage);
      expect(scenario.patient.checklist.length).toBeGreaterThanOrEqual(3);
      expect(scenario.patient.nowStack.length).toBeGreaterThanOrEqual(2);
      expect(scenario.partner.actions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps sensitive stage 4 phrasing private and stage-specific utility fields real', () => {
    const stage4 = JSON.stringify(DEMO_SCENARIOS.fertilization);
    expect(stage4).toContain('PrivacyRespectNotice');
    expect(stage4).not.toMatch(/정자|난자|수정률|성공|실패/u);

    const injectionLog = DEMO_SCENARIOS.ovarian_stimulation.patient.utilityCards.find((card) => card.type === 'injection_log');
    expect(injectionLog!.stateSeed!.values).toMatchObject({ administered_by: 'self', recorded_by: 'patient', confirmed_by_patient: false });

    const timeline = DEMO_SCENARIOS.embryo_culture.patient.utilityCards.find((card) => card.type === 'timeline');
    expect(timeline!.stateSeed!.values).toMatchObject({ day1: 'done', day3: 'active', day5: 'upcoming' });
  });

  it('removes the old 3-scene PresentationCareParam dependency from demo data', () => {
    const source = readFileSync('app/demo/demo-scenarios.ts', 'utf8');
    expect(source).not.toContain('PresentationCareParam');
    expect(source).not.toContain("Record<PresentationCareParam");
    expect(source).not.toContain("care: 'injection'");
    expect(source).not.toContain("care: 'clinic'");
    expect(source).not.toContain("care: 'waiting'");
  });
});
