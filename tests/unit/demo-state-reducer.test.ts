import { describe, expect, it } from 'vitest';
import { DEMO_SCENARIOS } from '../../app/demo/demo-scenarios';
import { createInitialDemoState, demoReducer, getVisiblePartnerCards, summarizeSharedCareState } from '../../app/demo/demo-state';

describe('state-driven IVF demo reducer', () => {
  it('starts in the requested funnel mode with parsed result unset except legacy generated demo context', () => {
    expect(createInitialDemoState('2', 'intro')).toMatchObject({ mode: 'intro', parsedResult: null });
    expect(createInitialDemoState('2', 'input')).toMatchObject({ mode: 'input', parsedResult: null });
    expect(createInitialDemoState('2', 'generated').parsedResult?.inferredStage).toBe('ovarian_stimulation');
  });

  it('submits a clinic memo, stores parsed result, and moves into parsing mode', () => {
    const state = createInitialDemoState('2', 'input');
    const next = demoReducer(state, { type: 'SUBMIT_MEMO', input: '고날에프 225IU 오늘 밤 9시' });

    expect(next.mode).toBe('parsing');
    expect(next.parsedResult).toMatchObject({ inferredStage: 'ovarian_stimulation' });
    expect(next.selectedStage).toBe('ovarian_stimulation');
    expect(next.actionLog.at(-1)).toMatchObject({ action: 'memo_submitted', actor: 'patient' });
  });

  it('completes parsing into generated mode and resets the one-shot funnel', () => {
    const submitted = demoReducer(createInitialDemoState('2', 'input'), { type: 'SUBMIT_MEMO', input: '피검 hCG 결과 전화' });
    const generated = demoReducer(submitted, { type: 'PARSING_COMPLETE' });

    expect(generated.mode).toBe('generated');
    expect(generated.selectedStage).toBe('pregnancy_test');

    const reset = demoReducer(generated, { type: 'RESET_DEMO' });
    expect(reset).toMatchObject({ mode: 'intro', parsedResult: null, actionLog: [] });
  });

  it('selects stage and records URL-synced stage changes in the action log', () => {
    const state = createInitialDemoState('2');
    const next = demoReducer(state, { type: 'SELECT_STAGE', stage: 'embryo_culture' });

    expect(next.selectedStage).toBe('embryo_culture');
    expect(next.careCycle.currentStage).toBe('embryo_culture');
    expect(next.mode).toBe('generated');
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
