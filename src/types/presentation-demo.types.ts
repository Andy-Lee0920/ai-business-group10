import type { CareActionCard, DisplaySafetyLevel } from './care-cards.types';

export type PresentationCareActionCard = CareActionCard & {
  readonly displaySafetyLevel: DisplaySafetyLevel;
};
