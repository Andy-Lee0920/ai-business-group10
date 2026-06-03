import { NextResponse, type NextRequest } from 'next/server';
import { getPolicySeed } from '../../../../src/data/policy-seed';
import {
  evaluatePolicySupport,
  mapPolicySeedToStructuredPolicy,
  type MaritalStatus,
  type PolicySupportTreatmentType,
  type PolicySupportUserContext,
} from '../../../../src/domain/policy-support';

type PolicySupportEvaluateBody = {
  sido?: unknown;
  sigungu?: unknown;
  treatment_type?: unknown;
  treatment_start_date?: unknown;
  evaluation_date?: unknown;
  marital_status?: unknown;
  has_infertility_diagnosis?: unknown;
  has_decision_notice?: unknown;
  support_attempt_count?: unknown;
  drug_external_expected?: unknown;
};

const TREATMENT_TYPES = {
  fresh_embryo: 'fresh_embryo',
  frozen_embryo: 'frozen_embryo',
  iui: 'iui',
  ivf_fresh: 'fresh_embryo',
  ivf_frozen: 'frozen_embryo',
} as const satisfies Record<string, PolicySupportTreatmentType>;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PolicySupportEvaluateBody;
  const input = normalizeInput(body);

  if ('error' in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const seed = getPolicySeed(input.sido, input.sigungu);
  const policy = mapPolicySeedToStructuredPolicy(seed, input.sigungu);
  const result = evaluatePolicySupport(input.userContext, policy);

  return NextResponse.json({
    persisted: false,
    source: 'policy_seed',
    policy: {
      sido: policy.province,
      sigungu: policy.district,
      health_center: policy.healthCenter,
      department: policy.department,
      phone: policy.phone,
      email: policy.email,
      sources: policy.sources,
    },
    result,
  });
}

function normalizeInput(
  body: PolicySupportEvaluateBody,
):
  | {
      sido: string;
      sigungu: string;
      userContext: PolicySupportUserContext;
    }
  | { error: string } {
  const sido = normalizeText(body.sido);
  const sigungu = normalizeText(body.sigungu);
  const treatmentType = normalizeTreatmentType(body.treatment_type);

  if (!sido || !sigungu || !treatmentType) {
    return { error: '시도, 시군구, 시술 유형을 확인해 주세요.' };
  }

  const treatmentStartDate = normalizeTreatmentStartDate(body.treatment_start_date);

  return {
    sido,
    sigungu,
    userContext: {
      province: sido,
      district: sigungu,
      treatmentType,
      treatmentStartDate,
      evaluationDate: normalizeDate(body.evaluation_date),
      maritalStatus: normalizeMaritalStatus(body.marital_status),
      hasDiagnosisCertificate: normalizeBooleanUnknown(body.has_infertility_diagnosis),
      hasDecisionNotice: normalizeBooleanUnknown(body.has_decision_notice),
      supportAttemptCount: normalizeSupportAttemptCount(body.support_attempt_count),
      externalDrugCostExpected: normalizeBooleanUnknown(body.drug_external_expected),
    },
  };
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 40) : '';
}

function normalizeTreatmentType(value: unknown): PolicySupportTreatmentType | null {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!isTreatmentTypeKey(key)) return null;

  return TREATMENT_TYPES[key];
}

function isTreatmentTypeKey(value: string): value is keyof typeof TREATMENT_TYPES {
  return value in TREATMENT_TYPES;
}

function normalizeTreatmentStartDate(value: unknown): string {
  if (typeof value !== 'string') return '모름';
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/u.test(trimmed)) return trimmed;
  if (/^\d{4}년\s*\d{1,2}월\s*\d{1,2}일$/u.test(trimmed)) return trimmed;
  return '모름';
}

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/u.test(trimmed) ? trimmed : undefined;
}

function normalizeMaritalStatus(value: unknown): MaritalStatus {
  if (value === 'married' || value === 'defacto') return value;
  return 'unknown';
}

function normalizeBooleanUnknown(value: unknown): boolean | 'unknown' {
  if (value === true || value === false) return value;
  if (value === 'true' || value === 'yes') return true;
  if (value === 'false' || value === 'no') return false;
  return 'unknown';
}

function normalizeSupportAttemptCount(value: unknown): number | 'unknown' {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return 'unknown';
  }

  return Math.min(value, 30);
}
