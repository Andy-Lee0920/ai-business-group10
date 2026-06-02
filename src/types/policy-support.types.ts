export type TreatmentType = 'ivf_fresh' | 'ivf_frozen' | 'iui' | 'unknown';

export type EligibilityStatus =
  | 'confirmed'
  | 'needs_check'
  | 'action_required'
  | 'risk'
  | 'not_applicable'
  | 'unknown';

export type OverallStatus =
  | 'eligible_likely'
  | 'action_required'
  | 'uncertain'
  | 'likely_ineligible';

export type PolicyStructuredSeed = {
  sido: string;
  sigungu: string | null;
  health_center_name: string;
  dept_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  target_married: boolean;
  target_defacto: boolean;
  target_income_criteria: string | null;
  target_age_limit: { female_max: number | null; male_max: number | null } | null;

  ivf_fresh_limit: number | null;
  ivf_frozen_limit: number | null;
  iui_limit: number | null;
  drug_external_covered: boolean | null;
  non_covered_items: string[] | null;
  non_covered_excluded: string[] | null;

  require_decision_notice: boolean;
  apply_before_treatment: boolean;
  online_apply_available: boolean;
  apply_url: string | null;
  required_documents: string[];

  budget_exhausted: boolean;
  budget_notice: string | null;
  budget_checked_at: string; // ISO datetime

  valid_from: string | null;
  valid_until: string | null;
  source_url: string;
  last_verified_at: string; // ISO datetime
  confidence: number; // 0–1
};

export type UserTreatmentContext = {
  sido: string;
  sigungu: string;
  treatment_type: TreatmentType;
  treatment_start_date: string | null; // ISO date
  has_infertility_diagnosis: boolean;
  has_decision_notice: boolean;
  support_attempt_count: number;
  drug_external_occurred: boolean | null;
};

export type CheckResult = {
  id: string;
  item: string;
  status: EligibilityStatus;
  note: string;
  days_until_treatment?: number;
  limit?: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  sub: string;
  priority: 'urgent' | 'normal' | 'done';
  done: boolean;
  deadline?: string; // ISO date
};

export type EligibilityResult = {
  overall_status: OverallStatus;
  overall_label: string;
  policy_source: {
    health_center: string;
    dept: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    source_url: string;
    last_verified_at: string;
    confidence: number;
  };
  checks: CheckResult[];
  support_amounts: {
    ivf_fresh_limit: number | null;
    ivf_frozen_limit: number | null;
    iui_limit: number | null;
    drug_external_covered: boolean | null;
    non_covered_possible: string[];
    non_covered_excluded: string[];
  };
  checklist: ChecklistItem[];
  inquiry_purposes: string[];
  disclaimer: string;
};
