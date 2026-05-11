import type { HomeContext } from '../../domain/home-composition';
import type { CareDay } from '../../types/care-cards.types';

export type AdaptiveCareDay = Extract<CareDay, 'injection_day' | 'clinic_day' | 'waiting_day'>;

export type AdaptiveStateHomeBaseProps = {
  context: HomeContext;
  demoMode?: boolean;
};

export type PrimaryActionInfo = {
  label: string;
  href: string;
  helperText: string;
};

export type PartnerRoleInfo = {
  title: string;
  description: string;
  checklist: string[];
};

export type NotificationToneInfo = {
  label: string;
  description: string;
  example: string;
};
