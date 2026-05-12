import { describe, expect, it } from 'vitest';
import { DEMO_SCENARIOS } from '../../app/demo/demo-scenarios';
import { createInitialDemoState, demoReducer, getVisiblePartnerCards, summarizeSharedCareState } from '../../app/demo/demo-state';

describe('state-driven IVF demo reducer', () => {
  it('selects stage and records URL-synced stage changes in the action log', () => {
    const state = createInitialDemoState('2');
    const next = demoReducer(state, { type: 'SELECT_STAGE', stage: 'embryo_culture' });

    expect(next.selectedStage).toBe('embryo_culture');
    expect(next.careCycle.currentStage).toBe('embryo_culture');
    expect(next.actionLog.at(-1)).toMatchObject({ action: 'stage_changed', stage: 'embryo_culture', actor: 'patient' });
  });

  it('tracks partner injection completion separately from patient confirmation', () => {
    const state = createInitialDemoState('2');
    const completed = demoReducer(state, { type: 'COMPLETE_CARD', cardId: 'stim-log', actor: 'partner' });

    expect(completed.utilityState['stim-log']).toMatchObject({ status: 'completed', completedBy: 'partner', confirmedByPatient: false });
    const confirmed = demoReducer(completed, { type: 'CONFIRM_BY_PATIENT', cardId: 'stim-log' });
    expect(confirmed.utilityState['stim-log']).toMatchObject({ confirmedByPatient: true });
  });

  it('updates Stage 5 timeline values through utility card state', () => {
    const state = createInitialDemoState('5');
    const next = demoReducer(state, { type: 'UPDATE_CARD_VALUE', cardId: 'culture-timeline', key: 'day3', value: 'done', actor: 'patient' });
    expect(next.utilityState['culture-timeline'].values).toMatchObject({ day1: 'done', day3: 'done', day5: 'upcoming' });
  });

  it('projects partner cards by sharing level and summarizes shared care state', () => {
    const basic = createInitialDemoState('7');
    expect(getVisiblePartnerCards(DEMO_SCENARIOS.pregnancy_test, basic).map((card) => card.id)).not.toContain('partner-result-status');

    const care = demoReducer(basic, { type: 'SET_SHARING_LEVEL', level: 'care', actor: 'patient' });
    expect(getVisiblePartnerCards(DEMO_SCENARIOS.pregnancy_test, care).map((card) => card.id)).toContain('partner-result-status');

    const summary = summarizeSharedCareState(care);
    expect(summary).toMatchObject({ stageLabel: '7/7 임신 확인', sharingLabel: '케어 공유' });
  });
});
