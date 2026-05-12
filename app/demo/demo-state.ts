import { DEMO_ORDER, DEMO_SCENARIOS, IVF_STAGES, STAGE_INDEX_TO_ID, type DemoScenario, type IvfStage, type IvfStageIndex, type Role, type SharingLevel, type UtilityCardStateSeed, type UtilityItem } from './demo-scenarios';

export type UtilityCardState = UtilityCardStateSeed;

export type ActionLogEntry = {
  id: string;
  timestamp: string;
  stage: IvfStage;
  actor: Role;
  action: 'card_completed' | 'value_entered' | 'sharing_changed' | 'stage_changed' | 'confirmation_requested' | 'patient_confirmed';
  targetId: string;
  payload?: Record<string, unknown>;
};

export type DemoState = {
  mode: 'intro' | 'stage';
  selectedStage: IvfStage;
  sharingLevel: SharingLevel;
  careCycle: { id: string; currentStage: IvfStage; dayLabel?: string };
  utilityState: Record<string, UtilityCardState>;
  actionLog: ActionLogEntry[];
};

export type DemoAction =
  | { type: 'SELECT_STAGE'; stage: IvfStage }
  | { type: 'COMPLETE_CARD'; cardId: string; actor: Role }
  | { type: 'UPDATE_CARD_VALUE'; cardId: string; key: string; value: string | number | boolean; actor: Role }
  | { type: 'SET_SHARING_LEVEL'; level: SharingLevel; actor: Role }
  | { type: 'CONFIRM_BY_PATIENT'; cardId: string };

export function createInitialDemoState(stageIndex: IvfStageIndex = '2', mode: DemoState['mode'] = 'stage'): DemoState {
  const selectedStage = STAGE_INDEX_TO_ID[stageIndex] ?? 'ovarian_stimulation';
  return {
    mode,
    selectedStage,
    sharingLevel: selectedStage === 'fertilization' || selectedStage === 'pregnancy_test' ? 'basic' : 'care',
    careCycle: { id: 'demo-cycle-001', currentStage: selectedStage, dayLabel: `${stageIndex}/7` },
    utilityState: buildUtilityState(),
    actionLog: [],
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'SELECT_STAGE': {
      const stageIndex = IVF_STAGES.find((stage) => stage.id === action.stage)?.index ?? 2;
      return appendLog({
        ...state,
        selectedStage: action.stage,
        sharingLevel: action.stage === 'fertilization' || action.stage === 'pregnancy_test' ? 'basic' : state.sharingLevel,
        careCycle: { ...state.careCycle, currentStage: action.stage, dayLabel: `${stageIndex}/7` },
      }, { actor: 'patient', action: 'stage_changed', stage: action.stage, targetId: action.stage });
    }
    case 'COMPLETE_CARD': {
      const current = state.utilityState[action.cardId] ?? { id: action.cardId, type: 'support_action', status: 'idle' as const };
      return appendLog({
        ...state,
        utilityState: {
          ...state.utilityState,
          [action.cardId]: { ...current, status: 'completed', completedBy: action.actor, confirmedByPatient: current.confirmedByPatient ?? false },
        },
      }, { actor: action.actor, action: 'card_completed', stage: state.selectedStage, targetId: action.cardId });
    }
    case 'UPDATE_CARD_VALUE': {
      const current = state.utilityState[action.cardId] ?? { id: action.cardId, type: 'result_input', status: 'active' as const };
      return appendLog({
        ...state,
        utilityState: {
          ...state.utilityState,
          [action.cardId]: { ...current, values: { ...current.values, [action.key]: action.value } },
        },
      }, { actor: action.actor, action: 'value_entered', stage: state.selectedStage, targetId: action.cardId, payload: { [action.key]: action.value } });
    }
    case 'SET_SHARING_LEVEL':
      return appendLog({ ...state, sharingLevel: action.level }, { actor: action.actor, action: 'sharing_changed', stage: state.selectedStage, targetId: 'sharingLevel', payload: { level: action.level } });
    case 'CONFIRM_BY_PATIENT': {
      const current = state.utilityState[action.cardId] ?? { id: action.cardId, type: 'injection_log', status: 'active' as const };
      return appendLog({
        ...state,
        utilityState: { ...state.utilityState, [action.cardId]: { ...current, confirmedByPatient: true, values: { ...current.values, confirmed_by_patient: true } } },
      }, { actor: 'patient', action: 'patient_confirmed', stage: state.selectedStage, targetId: action.cardId });
    }
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function getVisiblePartnerCards(scenario: DemoScenario, state: Pick<DemoState, 'sharingLevel' | 'utilityState'>): UtilityItem[] {
  const base = scenario.partner.actions.filter((card) => {
    if (card.requiresSharingLevel === 'emotional') return state.sharingLevel === 'emotional';
    if (card.requiresSharingLevel === 'care') return state.sharingLevel === 'care' || state.sharingLevel === 'emotional';
    return true;
  });

  const pain = Number(state.utilityState['retrieval-recovery']?.values?.pain ?? 0);
  if (scenario.stage === 'egg_retrieval' && pain >= 7 && !base.some((card) => card.id === 'partner-redflag-watch')) {
    return [...base, { id: 'partner-redflag-watch', type: 'support_action', label: '회복 상태 확인이 필요해요', value: '통증 수치 확인', tone: 'coral' }];
  }
  return base;
}

export function summarizeSharedCareState(state: DemoState) {
  const meta = IVF_STAGES.find((stage) => stage.id === state.selectedStage) ?? IVF_STAGES[1];
  const completedCount = state.actionLog.filter((entry) => entry.action === 'card_completed').length;
  const lastEvent = state.actionLog.at(-1) ?? null;
  return {
    stageLabel: `${meta.index}/7 ${meta.label}`,
    sharingLabel: sharingLabel(state.sharingLevel),
    completedCount,
    lastEventLabel: lastEvent ? `${actorLabel(lastEvent.actor)}가 ${lastEvent.targetId}을 ${actionLabel(lastEvent.action)}` : '아직 기록된 행동이 없어요',
  };
}

function buildUtilityState() {
  const entries = DEMO_ORDER.flatMap((stage) => {
    const scenario = DEMO_SCENARIOS[stage];
    return [...scenario.patient.utilityCards, ...scenario.partner.actions].flatMap((item) => item.stateSeed ? [[item.stateSeed.id, item.stateSeed] as const] : []);
  });
  return Object.fromEntries(entries);
}

function appendLog(state: DemoState, event: Omit<ActionLogEntry, 'id' | 'timestamp'>): DemoState {
  return {
    ...state,
    actionLog: [...state.actionLog, { ...event, id: `log-${state.actionLog.length + 1}`, timestamp: new Date().toISOString() }],
  };
}

function sharingLabel(level: SharingLevel) {
  if (level === 'basic') return '기본 공유';
  if (level === 'emotional') return '감정 공유';
  return '케어 공유';
}

function actorLabel(actor: Role) {
  return actor === 'partner' ? '파트너' : '환자';
}

function actionLabel(action: ActionLogEntry['action']) {
  if (action === 'card_completed') return '완료했어요';
  if (action === 'value_entered') return '입력했어요';
  if (action === 'sharing_changed') return '변경했어요';
  if (action === 'stage_changed') return '선택했어요';
  if (action === 'patient_confirmed') return '최종 확인했어요';
  return '확인을 요청했어요';
}
