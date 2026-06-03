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

