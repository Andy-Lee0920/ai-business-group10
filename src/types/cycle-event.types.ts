export type IvfPhase =
  | 'consultation'
  | 'period'
  | 'stimulation'
  | 'follicle_monitoring'
  | 'trigger_wait'
  | 'retrieval_scheduled'
  | 'retrieval_done'
  | 'cycle_cancelled'
  | 'stimulation_extended'
  | 'embryo_culture'
  | 'freeze_all'
  | 'frozen_transfer_wait'
  | 'frozen_transfer_preparation'
  | 'transfer_scheduled'
  | 'two_week_wait'
  | 'beta_wait'
  | 'beta_followup'
  | 'result_protection'
  | 'ultrasound_wait'
  | 'cycle_closed'
  | 'next_cycle_planning';

export type PhaseEvidence = {
  eventType: CycleEvent['type'];
  eventDate: string;
  phase: IvfPhase;
  confidence: CyclePhaseState['confidence'];
};

export type CyclePhaseState = {
  predictedPhase: IvfPhase | null;
  suggestedPhase: IvfPhase | null;
  confirmedPhase: IvfPhase;
  confidence: 'low' | 'medium' | 'high';
  evidence: PhaseEvidence[];
};

export type EventConfirmedBy = 'user' | 'clinic_note';

export type CycleEvent =
  | { type: 'period_started'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'stimulation_started'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'follicle_scan_recorded'; date: string; noteId: string }
  | { type: 'trigger_scheduled'; date: string; time: string; confirmedBy: EventConfirmedBy }
  | { type: 'retrieval_scheduled'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'retrieval_done'; date: string; oocyteCount?: number; confirmedBy: EventConfirmedBy }
  | { type: 'retrieval_cancelled'; date: string; reason?: string; confirmedBy: EventConfirmedBy }
  | { type: 'embryo_culture_started'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'freeze_all_decided'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'fresh_transfer_cancelled'; date: string; reason?: string; confirmedBy: EventConfirmedBy }
  | { type: 'frozen_transfer_preparation_started'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'embryo_transfer_scheduled'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'embryo_transfer_done'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'beta_test_scheduled'; date: string; confirmedBy: EventConfirmedBy }
  | { type: 'beta_test_recorded'; date: string; resultStatus: 'pending' | 'repeat_needed' | 'positive' | 'negative'; hcgValue?: number }
  | { type: 'cycle_closed'; date: string; outcome: 'positive' | 'negative' | 'cancelled' | 'paused'; confirmedBy: EventConfirmedBy };
