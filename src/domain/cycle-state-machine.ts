import type { CycleEvent, CyclePhaseState, IvfPhase, PhaseEvidence } from '../types/cycle-event.types';
import type { TimelineCareDay } from '../types/treatment-timeline.types';

const INITIAL_STATE: CyclePhaseState = {
  predictedPhase: null,
  suggestedPhase: null,
  confirmedPhase: 'consultation',
  confidence: 'low',
  evidence: [],
};

export function reduceCycleState(events: readonly CycleEvent[]): CyclePhaseState {
  return [...events]
    .sort(compareEvents)
    .reduce<CyclePhaseState>((state, event) => applyCycleEvent(state, event), INITIAL_STATE);
}


export function careDayForConfirmedPhase(phase: IvfPhase): TimelineCareDay {
  if (phase === 'stimulation' || phase === 'trigger_wait') return 'injection_day';
  if (phase === 'follicle_monitoring' || phase === 'retrieval_scheduled' || phase === 'transfer_scheduled' || phase === 'beta_wait') return 'clinic_day';
  if (phase === 'two_week_wait') return 'two_week_wait_day';
  if (phase === 'result_protection') return 'result_protection_day';
  if (phase === 'embryo_culture' || phase === 'freeze_all' || phase === 'frozen_transfer_wait' || phase === 'beta_followup') return 'waiting_day';
  return 'routine_day';
}

export function getConfirmedSurfacePhase(state: Pick<CyclePhaseState, 'confirmedPhase'>): IvfPhase {
  return state.confirmedPhase;
}

function applyCycleEvent(state: CyclePhaseState, event: CycleEvent): CyclePhaseState {
  const transition = phaseForEvent(event);
  const next: CyclePhaseState = {
    predictedPhase: predictedPhaseForEvent(event, transition.predictedPhase),
    suggestedPhase: transition.suggestedPhase ?? null,
    confirmedPhase: transition.confirmedPhase,
    confidence: transition.confidence,
    evidence: [...state.evidence, toEvidence(event, transition.confirmedPhase, transition.confidence)],
  };

  if (event.type === 'beta_test_scheduled' && state.confirmedPhase === 'two_week_wait') {
    return {
      ...next,
      confirmedPhase: 'two_week_wait',
      predictedPhase: 'beta_wait',
      evidence: [...state.evidence, toEvidence(event, 'two_week_wait', 'high')],
    };
  }

  return next;
}

type Transition = {
  confirmedPhase: IvfPhase;
  confidence: CyclePhaseState['confidence'];
  suggestedPhase?: IvfPhase | null;
  predictedPhase?: IvfPhase | null;
};

function phaseForEvent(event: CycleEvent): Transition {
  switch (event.type) {
    case 'period_started':
      return { confirmedPhase: 'period', confidence: 'high' };
    case 'stimulation_started':
      return { confirmedPhase: 'stimulation', confidence: 'high' };
    case 'follicle_scan_recorded':
      return { confirmedPhase: 'follicle_monitoring', confidence: 'medium', suggestedPhase: 'trigger_wait' };
    case 'trigger_scheduled':
      return { confirmedPhase: 'trigger_wait', confidence: 'high', predictedPhase: 'retrieval_scheduled' };
    case 'retrieval_scheduled':
      return { confirmedPhase: 'retrieval_scheduled', confidence: 'high' };
    case 'retrieval_done':
      return { confirmedPhase: 'retrieval_done', confidence: 'high', predictedPhase: 'embryo_culture' };
    case 'retrieval_cancelled':
      return { confirmedPhase: 'cycle_cancelled', confidence: 'high' };
    case 'embryo_culture_started':
      return { confirmedPhase: 'embryo_culture', confidence: 'high' };
    case 'freeze_all_decided':
      return { confirmedPhase: 'freeze_all', confidence: 'high', predictedPhase: 'frozen_transfer_wait' };
    case 'fresh_transfer_cancelled':
      return { confirmedPhase: 'freeze_all', confidence: 'high' };
    case 'frozen_transfer_preparation_started':
      return { confirmedPhase: 'frozen_transfer_preparation', confidence: 'high', predictedPhase: 'transfer_scheduled' };
    case 'embryo_transfer_scheduled':
      return { confirmedPhase: 'transfer_scheduled', confidence: 'high' };
    case 'embryo_transfer_done':
      return { confirmedPhase: 'two_week_wait', confidence: 'high', predictedPhase: 'beta_wait' };
    case 'beta_test_scheduled':
      return { confirmedPhase: 'beta_wait', confidence: 'high' };
    case 'beta_test_recorded':
      return betaResultTransition(event.resultStatus);
    case 'cycle_closed':
      return { confirmedPhase: event.outcome === 'negative' ? 'result_protection' : 'cycle_closed', confidence: 'high' };
    default:
      return assertNever(event);
  }
}

function betaResultTransition(resultStatus: Extract<CycleEvent, { type: 'beta_test_recorded' }>['resultStatus']): Transition {
  if (resultStatus === 'positive') return { confirmedPhase: 'ultrasound_wait', confidence: 'high' };
  if (resultStatus === 'negative') return { confirmedPhase: 'result_protection', confidence: 'high' };
  if (resultStatus === 'repeat_needed') return { confirmedPhase: 'beta_followup', confidence: 'high' };
  return { confirmedPhase: 'beta_wait', confidence: 'medium' };
}

function predictedPhaseForEvent(event: CycleEvent, fallback: IvfPhase | null | undefined): IvfPhase | null {
  if (event.type === 'beta_test_scheduled') return 'beta_wait';
  return fallback ?? null;
}

function toEvidence(event: CycleEvent, phase: IvfPhase, confidence: CyclePhaseState['confidence']): PhaseEvidence {
  return { eventType: event.type, eventDate: event.date, phase, confidence };
}

function compareEvents(left: CycleEvent, right: CycleEvent) {
  return left.date.localeCompare(right.date);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled cycle event: ${JSON.stringify(value)}`);
}
