import type { ClinicUpdate, Medication } from './slc.types';

export type ClinicGuideStep =
  | 'same_medication'
  | 'add_medication'
  | 'medication_days'
  | 'next_visit'
  | 'trigger_plan'
  | 'memo';

export interface ClinicGuideRequest {
  patientId: string;
  step: ClinicGuideStep;
  context: Partial<ClinicUpdate>;
  userInput: string;
}

export interface ClinicGuideResponse {
  nextStep: ClinicGuideStep | null;
  question: string;
  chips?: string[];
  draft: Partial<ClinicUpdate>;
  requiresUserConfirmation: true;
}

export interface ClinicGuideMedicationNormalizeRequest {
  userInput: string;
  patientId: string;
}

export interface ClinicGuideMedicationNormalizeResponse {
  matched: Medication | null;
  source: 'aliases' | 'llm' | 'none';
}
