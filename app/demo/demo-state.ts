import { parseClinicMemo, type ParsedClinicMemo } from '../../src/domain/clinic-memo-parser';
import { DEMO_ORDER, DEMO_SCENARIOS, IVF_STAGES, STAGE_INDEX_TO_ID, stageIndexFor, type DemoScenario, type IvfStage, type IvfStageIndex, type Role, type SharingLevel, type UtilityCardStateSeed, type UtilityCardValue, type UtilityItem } from './demo-scenarios';

export type UtilityCardState = UtilityCardStateSeed;

export type ActionLogPayload =
  | { field: string; value: UtilityCardValue }
  | { level: SharingLevel };

export type ActionLogEntry = {
  id: string;
  timestamp: string;
  stage: IvfStage;
  actor: Role;
  action: 'memo_submitted' | 'card_completed' | 'value_entered' | 'sharing_changed' | 'stage_changed' | 'confirmation_requested' | 'patient_confirmed';
  targetId: string;
  payload?: ActionLogPayload;
};

export type DemoState = {
  mode: 'intro' | 'input' | 'parsing' | 'generated';
  parsedResult: ParsedClinicMemo | null;
  selectedStage: IvfStage;
  sharingLevel: SharingLevel;
  careCycle: { id: string; currentStage: IvfStage; dayLabel?: string };
  utilityState: Record<string, UtilityCardState>;
  actionLog: ActionLogEntry[];
};

export type DemoAction =
  | { type: 'START_INPUT' }
  | { type: 'SUBMIT_MEMO'; input: string }
  | { type: 'PARSING_COMPLETE' }
  | { type: 'RESET_DEMO' }
  | { type: 'SELECT_STAGE'; stage: IvfStage }
  | { type: 'COMPLETE_CARD'; cardId: string; actor: Role }
  | { type: 'UPDATE_CARD_VALUE'; cardId: string; key: string; value: UtilityCardValue; actor: Role }
  | { type: 'SET_SHARING_LEVEL'; level: SharingLevel; actor: Role }
  | { type: 'CONFIRM_BY_PATIENT'; cardId: string };

export function createInitialDemoState(stageIndex: IvfStageIndex = '2', mode: DemoState['mode'] = 'generated'): DemoState {
  const selectedStage = STAGE_INDEX_TO_ID[stageIndex] ?? 'ovarian_stimulation';
  return {
    mode,
    parsedResult: mode === 'generated' ? parseClinicMemo(sampleMemoForStage(selectedStage)) : null,
    selectedStage,
    sharingLevel: selectedStage === 'fertilization' || selectedStage === 'pregnancy_test' ? 'basic' : 'care',
    careCycle: { id: 'demo-cycle-001', currentStage: selectedStage, dayLabel: `${stageIndex}/7` },
    utilityState: buildUtilityState(),
    actionLog: [],
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'START_INPUT':
      return { ...createInitialDemoState('2', 'input'), actionLog: [] };
    case 'SUBMIT_MEMO': {
      const parsedResult = parseClinicMemo(action.input);
      const selectedStage = parsedResult.inferredStage;
      const stageIndex = stageIndexFor(selectedStage);
      return appendLog({
        ...state,
        mode: 'parsing',
        parsedResult,
        selectedStage,
        sharingLevel: selectedStage === 'fertilization' || selectedStage === 'pregnancy_test' ? 'basic' : 'care',
        careCycle: { ...state.careCycle, currentStage: selectedStage, dayLabel: `${stageIndex}/7` },
      }, { actor: 'patient', action: 'memo_submitted', stage: selectedStage, targetId: 'clinic-memo' });
    }
    case 'PARSING_COMPLETE':
      return { ...state, mode: 'generated' };
    case 'RESET_DEMO':
      return createInitialDemoState('2', 'intro');
    case 'SELECT_STAGE': {
      const stageIndex = IVF_STAGES.find((stage) => stage.id === action.stage)?.index ?? 2;
      return appendLog({
        ...state,
        mode: 'generated',
        parsedResult: parseClinicMemo(sampleMemoForStage(action.stage)),
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
      }, { actor: action.actor, action: 'value_entered', stage: state.selectedStage, targetId: action.cardId, payload: { field: action.key, value: action.value } });
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
    lastEventLabel: lastEvent ? `${actorLabel(lastEvent.actor)}가 ${eventTargetLabel(lastEvent)}을 ${actionLabel(lastEvent.action)}` : '아직 기록된 행동이 없어요',
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
  if (level === 'basic') return '일정만 공유';
  if (level === 'emotional') return '감정까지 공유';
  return '케어 공유';
}

function eventTargetLabel(event: ActionLogEntry) {
  if (event.action === 'stage_changed') {
    const meta = IVF_STAGES.find((stage) => stage.id === event.stage);
    return meta ? `${meta.index}/7 ${meta.label}` : '단계';
  }

  const labelById: Record<string, string> = {
    'sharingLevel': '공유 범위',
    'stim-log': '주사 기록',
    'stim-medication': '약 이름과 시간',
    'culture-timeline': '배아 업데이트',
    'culture-share': '공유 범위',
    'beta-hcg-input': 'hCG 결과',
    'result-visibility': '공유 범위',
    'next-step-planner': '다음 단계',
  };
  return labelById[event.targetId] ?? '오늘 행동';
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
  if (action === 'memo_submitted') return '읽기 시작했어요';
  return '확인을 요청했어요';
}

function sampleMemoForStage(stage: IvfStage) {
  switch (stage) {
    case 'baseline_testing':
      return '내일 오전 9시 초음파 채혈 방문';
    case 'ovarian_stimulation':
      return '고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인\n남편은 주사 30분 전에 준비물 확인';
    case 'egg_retrieval':
      return '채취 전날 밤부터 금식\n오전 8시 병원 도착\n배우자는 귀가 동행 준비';
    case 'fertilization':
      return '수정 결과는 내일 오전 전화 안내\n다음 일정만 파트너와 공유';
    case 'embryo_culture':
      return 'Day 3 배아 등급 확인 중\nDay 5 동결 여부 전화 예정';
    case 'embryo_transfer':
      return '이식 후 프로게스테론 질정 22시\n피검일은 D+10';
    case 'pregnancy_test':
      return '피검 hCG 결과 전화 대기\n결과 공유는 직접 선택';
  }
}
