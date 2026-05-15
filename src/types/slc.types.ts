export interface UserProfile {
  id: string;
  role: 'patient' | 'partner';
  display_name: string | null;
  linked_patient_id: string | null;
}

export type ScheduleStatus = 'upcoming' | 'due_soon' | 'due' | 'completed' | 'missed';
export type ScheduleType = 'injection' | 'medication' | 'clinic';
export type InjectionSite = 'upper_left' | 'upper_right' | 'lower_left' | 'lower_right';
export type MedicationUnit = 'IU' | 'mg' | 'μg' | 'ml' | '정' | '개' | 'syringe';

export interface ScheduleItem {
  id: string;
  patient_id: string;
  medication_id: string | null;
  type: ScheduleType;
  title: string;
  dose: string | null;
  unit: string | null;
  scheduled_at: string;
  status: ScheduleStatus;
  source: 'seed' | 'manual' | 'clinic_update' | 'onboarding_interview' | 'capture';
  created_at: string;
}

export interface CompletionRecord {
  id: string;
  schedule_item_id: string;
  patient_id: string;
  completed_at: string;
  injection_site: InjectionSite | null;
}

export interface ClinicUpdate {
  id: string;
  patient_id: string;
  same_medication: boolean | null;
  added_medication_ids: string[];
  medication_days: number | null;
  next_visit_at: string | null;
  trigger_plan: 'today' | 'tomorrow' | 'not_yet' | 'unknown' | null;
  memo: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  brand_name_ko: string;
  brand_name_en: string | null;
  aliases: string[];
  category: 'stimulation' | 'suppression' | 'trigger' | 'luteal_support' | 'other';
  route: 'subcutaneous_injection' | 'intramuscular_injection' | 'oral' | 'vaginal' | 'other';
  default_unit: string;
  default_cta: '주사하기' | '복용하기' | '사용하기';
  patient_label: string;
  time_criticality: 'normal' | 'high' | 'critical';
  is_slc_seed: boolean;
}

export interface PartnerLink {
  id: string;
  patient_id: string;
  partner_id: string | null;
  invite_code: string;
  status: 'pending' | 'requested' | 'approved' | 'rejected';
  requested_at?: string | null;
  approved_at?: string | null;
  partner_profile?: PartnerIdentity | null;
}

export interface PartnerIdentity {
  display_name: string | null;
}

export function computeStatus(scheduledAt: string): ScheduleStatus {
  const now = Date.now();
  const scheduled = new Date(scheduledAt).getTime();
  const diffMs = scheduled - now;
  const diffMin = diffMs / 60_000;
  if (diffMin > 15) return 'upcoming';
  if (diffMin > 0) return 'due_soon';
  if (diffMin > -30) return 'due';
  return 'missed';
}

export function ctaLabel(type: ScheduleType, defaultCta?: string): string {
  if (defaultCta) return defaultCta;
  if (type === 'injection') return '주사하기';
  if (type === 'medication') return '복용하기';
  return '방문 확인';
}

export function completedLabel(type: ScheduleType): string {
  if (type === 'injection') return '주사 완료';
  if (type === 'medication') return '복용 완료';
  return '방문 완료';
}
