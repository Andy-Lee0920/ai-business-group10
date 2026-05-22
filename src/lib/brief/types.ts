import type { IvfPhase } from '../../types/cycle-event.types';
import type { TimelineCareDay } from '../../types/treatment-timeline.types';

export type BriefPhase = IvfPhase | 'onboarding';

export type BriefFact = {
  fact: string;
  cite: string;
};

export type BriefInput = {
  confirmedPhase: BriefPhase;
  phaseCareDay: TimelineCareDay | 'onboarding';
  dayIndexInPhase: number;
  facts: readonly BriefFact[];
  recentCriticalEventTypes: readonly string[];
};

export type BriefResult = {
  line: string;
  source: 'llm' | 'fallback' | 'rejected_fallback';
  rejected: boolean;
};

export type PartnerBriefInput = {
  confirmedPhase: BriefPhase;
  phaseCareDay: TimelineCareDay | 'onboarding';
  cardTypes: readonly string[];
};

export type PartnerBriefResult = {
  momentLine: string;
  helpAction: string;
  source: 'llm' | 'fallback' | 'rejected_fallback';
};
