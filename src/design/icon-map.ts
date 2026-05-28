import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  Circle,
  CircleDot,
  ClipboardCheck,
  Clock,
  EyeOff,
  Layers,
  Leaf,
  NotebookPen,
  Pill,
  Radio,
  Share2,
  Stethoscope,
  Sun,
  Syringe,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AssignedTo, CardType, DisplaySafetyLevel } from '../types/care-cards.types';
import type { CareSurfacePhase } from '../features/adaptive-home/care-surface-primitives';

export type FevioIconTone = 'coral' | 'sage' | 'lavender' | 'amber' | 'neutral';
export type FevioIconSpec = { icon: LucideIcon; tone: FevioIconTone; size: number };

export const CARD_TYPE_ICONS: Record<CardType, FevioIconSpec> = {
  injection: { icon: Syringe, tone: 'coral', size: 16 },
  medication: { icon: Pill, tone: 'coral', size: 16 },
  clinic_visit: { icon: Building2, tone: 'sage', size: 16 },
  clinic_confirmation: { icon: ClipboardCheck, tone: 'sage', size: 16 },
  partner_support: { icon: Users, tone: 'lavender', size: 16 },
  record: { icon: NotebookPen, tone: 'sage', size: 16 },
  general_action: { icon: CircleDot, tone: 'neutral', size: 16 },
};

export const CARE_PHASE_ICONS: Record<CareSurfacePhase, FevioIconSpec> = {
  injection: { icon: Syringe, tone: 'coral', size: 32 },
  clinic: { icon: Stethoscope, tone: 'sage', size: 32 },
  waiting: { icon: Leaf, tone: 'lavender', size: 32 },
  two_week_wait: { icon: Leaf, tone: 'lavender', size: 32 },
  routine: { icon: Sun, tone: 'sage', size: 32 },
};

export const DISPLAY_SAFETY_ICONS: Record<DisplaySafetyLevel, FevioIconSpec> = {
  critical: { icon: AlertCircle, tone: 'coral', size: 16 },
  time_sensitive: { icon: Clock, tone: 'amber', size: 16 },
  normal: { icon: CheckCircle2, tone: 'sage', size: 16 },
};

export const ASSIGNED_TO_ICONS: Record<AssignedTo, FevioIconSpec> = {
  my_action: { icon: User, tone: 'sage', size: 16 },
  partner_action: { icon: UserCheck, tone: 'lavender', size: 16 },
  clinic_confirmation: { icon: Stethoscope, tone: 'sage', size: 16 },
  excluded: { icon: EyeOff, tone: 'neutral', size: 16 },
};

export const COMPONENT_ICONS = {
  partnerPresencePulse: { icon: Radio, tone: 'lavender', size: 20 },
  quietChecklistUnchecked: { icon: Circle, tone: 'neutral', size: 18 },
  quietChecklistChecked: { icon: CheckCircle2, tone: 'sage', size: 18 },
  operationalGlassSheetHeader: { icon: Layers, tone: 'sage', size: 16 },
  onboardingBrand: { icon: Leaf, tone: 'sage', size: 20 },
  captureInput: { icon: Camera, tone: 'sage', size: 16 },
  partnerShare: { icon: Share2, tone: 'lavender', size: 16 },
} as const satisfies Record<string, FevioIconSpec>;

export type FevioIconKey =
  | `card:${CardType}`
  | `phase:${CareSurfacePhase}`
  | `safety:${DisplaySafetyLevel}`
  | `assigned:${AssignedTo}`
  | `component:${keyof typeof COMPONENT_ICONS}`;

export function getFevioIcon(key: FevioIconKey): FevioIconSpec {
  const [scope, value] = key.split(':') as [string, string];
  if (scope === 'card') return CARD_TYPE_ICONS[value as CardType];
  if (scope === 'phase') return CARE_PHASE_ICONS[value as CareSurfacePhase];
  if (scope === 'safety') return DISPLAY_SAFETY_ICONS[value as DisplaySafetyLevel];
  if (scope === 'assigned') return ASSIGNED_TO_ICONS[value as AssignedTo];
  return COMPONENT_ICONS[value as keyof typeof COMPONENT_ICONS];
}
