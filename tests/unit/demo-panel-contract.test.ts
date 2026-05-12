import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DEMO_UI_FILES = [
  'app/demo/patient-panel.tsx',
  'app/demo/partner-panel.tsx',
  'app/demo/dual-panel-demo-client.tsx',
  'app/demo/demo-scenarios.ts',
  'app/demo/demo-state.ts',
];

const FORBIDDEN_PRODUCT_SURFACE_COPY = [
  'Utility components',
  'Partner utility',
  'Permission projection',
  'cards visible',
  'MedicationCard',
  'InjectionLog',
  'InjectionSitePicker',
  'SymptomTracker',
  'ProcedureChecklist',
  'RecoveryLog',
  'FertilizationMethodCard',
  'NextLabUpdateCard',
  'PrivacyRespectNotice',
  'SamplePreparationSchedule',
  'EmbryoUpdateTimeline',
  'EmbryoResultCard',
  'SharedUpdateStatus',
  'QuietSupportCard',
  'TransferSummaryCard',
  'LutealMedicationTracker',
  'BetaDateCard',
  'MedicationAssistCard',
  'ScheduleGuardCard',
  'BetaCountdownShared',
  'BetaHcgInputCard',
  'ResultVisibilityControl',
  'NextStepPlanner',
  'ResultSharedStatus',
  'NextAppointmentCard',
  'DoNotInterpretCard',
  'scheduled/actual/recorded',
];

describe('state-driven demo product surface', () => {
  it('does not expose internal component names, raw stage ids, or debug projection labels', () => {
    const combinedSource = DEMO_UI_FILES.map((file) => readFileSync(file, 'utf8')).join('\n');
    for (const forbidden of FORBIDDEN_PRODUCT_SURFACE_COPY) {
      expect(combinedSource).not.toContain(forbidden);
    }
  });

  it('keeps the reducer/action architecture while rendering through product card surfaces', () => {
    const patient = readFileSync('app/demo/patient-panel.tsx', 'utf8');
    const partner = readFileSync('app/demo/partner-panel.tsx', 'utf8');
    expect(patient).toContain('PatientProductCardRenderer');
    expect(partner).toContain('PartnerProductCard');
    expect(patient).toContain('dispatch({ type: \'COMPLETE_CARD\'');
    expect(patient).toContain('dispatch({ type: \'UPDATE_CARD_VALUE\'');
    expect(patient).toContain('dispatch({ type: \'SET_SHARING_LEVEL\'');
    expect(patient).toContain('dispatch({ type: \'CONFIRM_BY_PATIENT\'');
    expect(partner).toContain('getVisiblePartnerCards');
    expect(partner).toContain('dispatch({ type: \'COMPLETE_CARD\'');
    expect(`${patient}\n${partner}`).not.toMatch(/성공했어요|실패했어요|정상입니다|위험합니다/u);
  });

  it('uses layout primitives that prevent Korean labels from being squeezed into one-character columns', () => {
    const css = readFileSync('app/demo/dual-panel-demo.module.css', 'utf8');
    expect(css).toContain('word-break: keep-all');
    expect(css).toContain('overflow-wrap: normal');
    expect(css).toContain('.productDeck');
    expect(css).toContain('.productActionRow');
    expect(css).not.toContain('grid-template-columns: 22px 1fr;');
  });

  it('uses 7-stage accent classes only and has no legacy 3-scene phase classes', () => {
    const css = readFileSync('app/demo/dual-panel-demo.module.css', 'utf8');
    for (const klass of ['phaseHero_coral', 'phaseHero_sage', 'phaseHero_lavender', 'partnerHero_coral', 'partnerHero_sage', 'partnerHero_lavender']) {
      expect(css).toContain(`.${klass}`);
    }
    for (const legacy of ['phaseHero_injection', 'phaseHero_clinic', 'phaseHero_waiting', 'partnerHero_injection', 'partnerHero_clinic', 'partnerHero_waiting']) {
      expect(css).not.toContain(legacy);
    }
  });

});
