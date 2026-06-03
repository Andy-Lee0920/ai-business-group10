import type { PolicyStructuredSeed } from "../types/policy-support.types";
import {
  generatePolicyInquiryDraft,
  generatePolicyInquiryQuestions,
} from "./policy-support-inquiry";

export type PolicySupportTreatmentType =
  | "fresh_embryo"
  | "frozen_embryo"
  | "iui";

export type PolicySupportStatus =
  | "eligible_likely"
  | "needs_check"
  | "action_required"
  | "uncertain"
  | "unknown";

export type PolicyConditionStatus =
  | "confirmed"
  | "needs_check"
  | "action_required"
  | "risk"
  | "unknown";

export type MaritalStatus = "married" | "defacto" | "unknown";

export type PolicySupportUserContext = {
  province: string;
  district: string;
  treatmentType: PolicySupportTreatmentType;
  treatmentStartDate: string;
  evaluationDate?: string;
  maritalStatus: MaritalStatus;
  hasDiagnosisCertificate: boolean | "unknown";
  hasDecisionNotice: boolean | "unknown";
  supportAttemptCount: number | "unknown";
  externalDrugCostExpected: boolean | "unknown";
};

export type PolicyStructuredPolicy = {
  province: string;
  district: string;
  healthCenter: string;
  department: string;
  phone: string;
  email: string;
  targetMarried: boolean;
  targetDefacto: boolean;
  supportedTreatmentTypes: readonly PolicySupportTreatmentType[];
  requireDiagnosisCertificate: boolean;
  requireDecisionNoticeBeforeTreatment: boolean;
  applyBeforeTreatment?: boolean;
  budgetStatus: "available" | "exhausted" | "unknown";
  budgetNotice?: string | null;
  maxSupportAttempts: number | "unknown";
  externalDrugCovered?: boolean | null;
  onlineApplyAvailable?: boolean;
  policyConfidence?: number;
  requiredDocuments?: readonly string[];
  supportItems: readonly PolicySupportItem[];
  sources: readonly PolicySource[];
};

export type PolicySupportItem = {
  label: string;
  value: string;
};

export type PolicySource = {
  label: string;
  url: string;
  lastVerifiedAt: string;
};

export type PolicyConditionCheck = {
  item: string;
  status: PolicyConditionStatus;
  note: string;
  daysUntilTreatment?: number;
};

export type PolicySupportResult = {
  overallStatus: PolicySupportStatus;
  statusLabel: string;
  summary: string;
  conditionChecks: readonly PolicyConditionCheck[];
  supportItems: readonly PolicySupportItem[];
  checklistGroups: readonly PolicyChecklistGroup[];
  inquiryQuestions: readonly string[];
  inquiryDraft: PolicyInquiryDraft;
  disclaimer: string;
  sources: readonly PolicySource[];
};

export type PolicyChecklistGroup = {
  title: string;
  items: readonly string[];
};

export type PolicyInquiryDraft = {
  recipient: string;
  subject: string;
  bodyLines: readonly string[];
};

const TREATMENT_LABELS = {
  fresh_embryo: "체외수정 신선배아",
  frozen_embryo: "체외수정 동결배아",
  iui: "인공수정",
} as const satisfies Record<PolicySupportTreatmentType, string>;

export function evaluatePolicySupport(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy | null,
): PolicySupportResult {
  if (!policy) {
    return buildUnknownResult(user);
  }

  const conditionChecks: PolicyConditionCheck[] = [
    checkResidence(user, policy),
    checkMaritalStatus(user, policy),
    checkTreatmentType(user, policy),
    checkDiagnosisCertificate(user, policy),
    checkDecisionNotice(user, policy),
    checkBudget(policy),
    checkSupportAttempts(user, policy),
    checkExternalDrugCost(user, policy),
    checkPolicyConfidence(policy),
  ];

  const overallStatus = getOverallStatus(conditionChecks);
  const inquiryInput = { user, policy, conditionChecks };

  return {
    overallStatus,
    statusLabel: getStatusLabel(overallStatus),
    summary: getSummary(overallStatus, policy.healthCenter),
    conditionChecks,
    supportItems: policy.supportItems,
    checklistGroups: buildChecklistGroups(user, policy),
    inquiryQuestions: generatePolicyInquiryQuestions(inquiryInput),
    inquiryDraft: generatePolicyInquiryDraft(inquiryInput),
    disclaimer:
      "Fevio는 지원 대상 여부를 확정하지 않아요. 최종 지원 여부와 금액은 관할 보건소의 확인과 지원결정통지서 발급으로 확인됩니다.",
    sources: policy.sources,
  };
}

export function getTreatmentLabel(type: PolicySupportTreatmentType): string {
  return TREATMENT_LABELS[type];
}

export function mapPolicySeedToStructuredPolicy(
  seed: PolicyStructuredSeed,
  requestedDistrict: string,
): PolicyStructuredPolicy {
  const district = seed.sigungu ?? requestedDistrict;

  return {
    province: seed.sido,
    district,
    healthCenter:
      seed.health_center_name === "관할 보건소"
        ? `${district} 보건소`
        : seed.health_center_name,
    department: seed.dept_name ?? "모자보건 담당 부서",
    phone: seed.contact_phone ?? "보건소 대표번호 확인 필요",
    email: seed.contact_email ?? "이메일 확인 필요",
    targetMarried: seed.target_married,
    targetDefacto: seed.target_defacto,
    supportedTreatmentTypes: getSupportedTreatmentTypes(seed),
    requireDiagnosisCertificate: seed.required_documents.some((document) =>
      document.includes("난임진단서"),
    ),
    requireDecisionNoticeBeforeTreatment:
      seed.require_decision_notice && seed.apply_before_treatment,
    applyBeforeTreatment: seed.apply_before_treatment,
    budgetStatus: seed.budget_exhausted ? "exhausted" : "available",
    budgetNotice: seed.budget_notice,
    maxSupportAttempts: "unknown",
    externalDrugCovered: seed.drug_external_covered,
    onlineApplyAvailable: seed.online_apply_available,
    policyConfidence: seed.confidence,
    requiredDocuments: seed.required_documents,
    supportItems: buildSupportItems(seed),
    sources: [
      {
        label: `${district} 난임부부 시술비 지원 안내`,
        url: seed.source_url,
        lastVerifiedAt: formatPolicyDate(seed.last_verified_at),
      },
    ],
  };
}

function getSupportedTreatmentTypes(
  seed: PolicyStructuredSeed,
): PolicySupportTreatmentType[] {
  const types: PolicySupportTreatmentType[] = [];

  if (seed.ivf_fresh_limit !== null) types.push("fresh_embryo");
  if (seed.ivf_frozen_limit !== null) types.push("frozen_embryo");
  if (seed.iui_limit !== null) types.push("iui");

  return types;
}

function buildSupportItems(seed: PolicyStructuredSeed): PolicySupportItem[] {
  return [
    {
      label: "신선배아 상한",
      value: formatWonLimit(seed.ivf_fresh_limit),
    },
    {
      label: "동결배아 상한",
      value: formatWonLimit(seed.ivf_frozen_limit),
    },
    {
      label: "인공수정 상한",
      value: formatWonLimit(seed.iui_limit),
    },
    {
      label: "원외약제비",
      value: formatCovered(seed.drug_external_covered),
    },
  ];
}

function formatWonLimit(value: number | null): string {
  if (value === null) return "지원 정보 없음";
  return `최대 ${value.toLocaleString("ko-KR")}원`;
}

function formatCovered(value: boolean | null): string {
  if (value === true) return "지원 가능성 있음";
  if (value === false) return "지원 제외 가능성";
  return "보건소 확인 필요";
}

function formatPolicyDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function getDaysUntilTreatment(user: PolicySupportUserContext): number | null {
  if (!user.evaluationDate) return null;

  const treatmentDate = parsePolicySupportDate(user.treatmentStartDate);
  const evaluationDate = parsePolicySupportDate(user.evaluationDate);

  if (!treatmentDate || !evaluationDate) return null;

  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.round((treatmentDate.getTime() - evaluationDate.getTime()) / oneDayMs);
}

function parsePolicySupportDate(value: string): Date | null {
  const isoMatch = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec(value);
  const koreanMatch = /(?<year>\d{4})년\s*(?<month>\d{1,2})월\s*(?<day>\d{1,2})일/.exec(value);
  const match = isoMatch ?? koreanMatch;

  if (!match?.groups) return null;

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);

  if (!year || !month || !day) return null;

  return new Date(Date.UTC(year, month - 1, day));
}

function checkResidence(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  if (user.province === policy.province && user.district === policy.district) {
    return {
      item: "거주 지역",
      status: "confirmed",
      note: `거주 지역이 ${user.province} ${user.district}로 입력되어 있어요.`,
    };
  }

  return {
    item: "거주 지역",
    status: "risk",
    note: `정책 지역은 ${policy.province} ${policy.district}입니다. 관할 보건소 확인이 필요합니다.`,
  };
}

function checkMaritalStatus(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  if (user.maritalStatus === "married") {
    if (!policy.targetMarried) {
      return {
        item: "혼인 상태",
        status: "risk",
        note: "현재 정책에서 법적 혼인 대상 지원 여부를 확인하지 못했어요. 보건소 확인이 필요합니다.",
      };
    }
    return {
      item: "혼인 상태",
      status: "confirmed",
      note: "법적 혼인으로 입력되어 있어요.",
    };
  }

  if (user.maritalStatus === "defacto") {
    if (!policy.targetDefacto) {
      return {
        item: "혼인 상태",
        status: "risk",
        note: "현재 정책에서 사실혼 대상 지원 여부를 확인하지 못했어요. 보건소 직접 확인이 필요합니다.",
      };
    }
    return {
      item: "혼인 상태",
      status: "needs_check",
      note: "사실혼으로 입력되어 있어요. 지원 가능 여부와 제출 서류를 보건소에서 확인해야 해요.",
    };
  }

  return {
    item: "혼인 상태",
    status: "needs_check",
    note: "혼인 상태를 확인해야 해요. 법적 혼인 또는 사실혼 여부가 지원 조건에 영향을 줄 수 있어요.",
  };
}

function checkTreatmentType(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  const label = getTreatmentLabel(user.treatmentType);

  if (policy.supportedTreatmentTypes.includes(user.treatmentType)) {
    return {
      item: "시술 유형",
      status: "confirmed",
      note: `시술 유형이 ${label}로 선택되어 있어요.`,
    };
  }

  return {
    item: "시술 유형",
    status: "risk",
    note: `${label} 지원 여부를 이 지역 정책에서 확인하지 못했어요.`,
  };
}

function checkDiagnosisCertificate(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  if (!policy.requireDiagnosisCertificate) {
    return {
      item: "난임진단서",
      status: "confirmed",
      note: "현재 구조화 정책에서는 별도 진단서 요건이 표시되지 않았어요.",
    };
  }

  if (user.hasDiagnosisCertificate === true) {
    return {
      item: "난임진단서",
      status: "confirmed",
      note: "난임진단서를 보유한 상태로 표시되어 있어요.",
    };
  }

  if (user.hasDiagnosisCertificate === false) {
    return {
      item: "난임진단서",
      status: "action_required",
      note: "신청 전 난임진단서 준비가 필요할 수 있어요.",
    };
  }

  return {
    item: "난임진단서",
    status: "needs_check",
    note: "난임진단서 보유 여부를 확인해야 해요.",
  };
}

function checkDecisionNotice(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  if (!policy.requireDecisionNoticeBeforeTreatment) {
    return {
      item: "지원결정통지서",
      status: "confirmed",
      note: "현재 구조화 정책에서는 시술 전 통지서 요건이 표시되지 않았어요.",
    };
  }

  if (user.hasDecisionNotice === true) {
    return {
      item: "지원결정통지서",
      status: "confirmed",
      note: "지원결정통지서를 보유한 상태로 표시되어 있어요.",
    };
  }

  if (user.hasDecisionNotice === false) {
    const daysUntilTreatment = getDaysUntilTreatment(user);
    const applyBeforeTreatment =
      policy.applyBeforeTreatment ?? policy.requireDecisionNoticeBeforeTreatment;

    if (applyBeforeTreatment && daysUntilTreatment !== null && daysUntilTreatment < 0) {
      return {
        item: "지원결정통지서",
        status: "risk",
        note: "시술 시작 전 발급 조건이 있는데 입력된 시술 시작일이 이미 지났을 수 있어요.",
        daysUntilTreatment,
      };
    }

    if (applyBeforeTreatment && daysUntilTreatment !== null && daysUntilTreatment <= 3) {
      return {
        item: "지원결정통지서",
        status: "action_required",
        note: `시술 시작까지 ${daysUntilTreatment}일 남아 있어 지원결정통지서 발급 가능 여부를 바로 확인해야 해요.`,
        daysUntilTreatment,
      };
    }

    return {
      item: "지원결정통지서",
      status: "action_required",
      note: applyBeforeTreatment
        ? "시술 시작 전 지원결정통지서 발급 가능 여부를 확인해야 해요."
        : "지원결정통지서 발급 가능 여부를 확인해야 해요.",
      ...(daysUntilTreatment !== null ? { daysUntilTreatment } : {}),
    };
  }

  return {
    item: "지원결정통지서",
    status: "needs_check",
    note: "지원결정통지서 발급 여부를 확인해야 해요.",
  };
}

function checkBudget(policy: PolicyStructuredPolicy): PolicyConditionCheck {
  if (policy.budgetStatus === "available") {
    return {
      item: "예산",
      status: "confirmed",
      note: "구조화 정책에서 예산 접수 가능 상태로 표시되어 있어요.",
    };
  }

  if (policy.budgetStatus === "exhausted") {
    return {
      item: "예산",
      status: "risk",
      note: policy.budgetNotice ?? "예산 소진 또는 접수 마감 가능성이 있어요.",
    };
  }

  return {
    item: "예산",
    status: "needs_check",
    note: "관할 보건소에 예산 잔여 여부와 접수 가능 상태를 확인해야 해요.",
  };
}

function checkSupportAttempts(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  if (user.supportAttemptCount === "unknown" || policy.maxSupportAttempts === "unknown") {
    return {
      item: "지원 횟수",
      status: "needs_check",
      note: "기존 지원 이력과 잔여 지원 횟수 확인이 필요해요.",
    };
  }

  if (user.supportAttemptCount >= policy.maxSupportAttempts) {
    return {
      item: "지원 횟수",
      status: "risk",
      note: "입력된 지원 이력이 지역 한도에 도달했을 수 있어요.",
    };
  }

  return {
    item: "지원 횟수",
    status: "confirmed",
    note: `입력된 지원 이력은 ${user.supportAttemptCount}회입니다.`,
  };
}

function checkExternalDrugCost(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyConditionCheck {
  if (user.externalDrugCostExpected === true) {
    if (policy.externalDrugCovered === true) {
      return {
        item: "원외약제비",
        status: "needs_check",
        note: "정책상 원외약제비 지원 가능성이 있어 청구 서류와 제출 기한 확인이 필요해요.",
      };
    }

    if (policy.externalDrugCovered === false) {
      return {
        item: "원외약제비",
        status: "risk",
        note: "현재 구조화 정책에서는 원외약제비 지원 제외 가능성이 표시되어 있어요.",
      };
    }

    return {
      item: "원외약제비",
      status: "needs_check",
      note: "원외약제비 청구 가능 여부와 사후 제출 방식을 확인해야 해요.",
    };
  }

  if (user.externalDrugCostExpected === false) {
    return {
      item: "원외약제비",
      status: "confirmed",
      note: "현재 입력 정보에는 원외약제비 발생 가능성이 표시되지 않았어요.",
    };
  }

  return {
    item: "원외약제비",
    status: "needs_check",
    note: "원외약제비 발생 가능성이 있으면 청구 서류를 확인해야 해요.",
  };
}

function checkPolicyConfidence(policy: PolicyStructuredPolicy): PolicyConditionCheck {
  if (policy.policyConfidence === undefined) {
    return {
      item: "정책 데이터 신뢰도",
      status: "needs_check",
      note: "정책 데이터 검증 수준이 표시되지 않아 보건소 확인이 필요해요.",
    };
  }

  if (policy.policyConfidence < 0.7) {
    return {
      item: "정책 데이터 신뢰도",
      status: "needs_check",
      note: "현재 정책 데이터는 폴백 또는 낮은 신뢰도 자료라 관할 보건소 확인이 필요해요.",
    };
  }

  return {
    item: "정책 데이터 신뢰도",
    status: "confirmed",
    note: "정책 데이터 출처와 확인일이 표시되어 있어요.",
  };
}

function getOverallStatus(
  conditionChecks: readonly PolicyConditionCheck[],
): PolicySupportStatus {
  if (conditionChecks.some((check) => check.status === "action_required")) {
    return "action_required";
  }

  if (conditionChecks.some((check) => check.status === "risk")) {
    return "uncertain";
  }

  if (conditionChecks.some((check) => check.status === "needs_check")) {
    return "needs_check";
  }

  if (conditionChecks.some((check) => check.status === "unknown")) {
    return "unknown";
  }

  return "eligible_likely";
}

function getStatusLabel(status: PolicySupportStatus): string {
  if (status === "eligible_likely") return "신청 검토 가능성 있음";
  if (status === "needs_check") return "보건소 확인 필요";
  if (status === "action_required") return "시술 전 확인 필요";
  if (status === "uncertain") return "지원 가능성 불확실";
  return "지역 정책 정보 없음";
}

function getSummary(status: PolicySupportStatus, healthCenter: string): string {
  if (status === "eligible_likely") {
    return "현재 입력 정보 기준으로 지원 신청을 검토할 수 있는 상태예요.";
  }

  if (status === "action_required") {
    return `시술 시작 전 필요한 행정 확인이 있어요. ${healthCenter}에 먼저 확인해 주세요.`;
  }

  if (status === "uncertain") {
    return `입력 정보와 정책 조건이 일부 맞지 않을 수 있어요. ${healthCenter} 확인이 필요합니다.`;
  }

  if (status === "needs_check") {
    return `지원 가능성을 검토하려면 ${healthCenter}에서 추가 확인이 필요합니다.`;
  }

  return "해당 지역 정책 정보를 찾지 못했어요. 관할 보건소 직접 확인이 필요합니다.";
}

function buildChecklistGroups(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy,
): PolicyChecklistGroup[] {
  const groups: PolicyChecklistGroup[] = [
    {
      title: "지금 준비할 서류",
      items: [
        "난임진단서",
        "신분 확인 서류",
        "건강보험 자격 확인 자료",
        "시술 예정 확인 자료",
      ],
    },
    {
      title: "신청 전 해야 할 일",
      items: [
        "e보건소 또는 정부24 신청 가능 여부 확인",
        "관할 보건소 담당 부서 확인",
        "지원 회차와 기존 사용 이력 정리",
      ],
    },
    {
      title: "시술 시작 전 확인",
      items: [
        "지원결정통지서가 시술 시작 전 발급 가능한지 확인",
        "통지서 발급 후 병원 제출 방식 확인",
        "접수 마감 또는 예산 소진 공지 확인",
      ],
    },
  ];

  if (user.externalDrugCostExpected !== false) {
    groups.push({
      title: "원외약제비가 있다면",
      items: [
        "처방전 보관",
        "약제비 증빙 자료 보관",
        "청구 가능 기간과 제출처 확인",
      ],
    });
  }

  if (policy.budgetStatus !== "available") {
    groups.push({
      title: "보건소 확인",
      items: ["예산 잔여 여부 확인", "현재 접수 가능 여부 확인"],
    });
  }

  return groups;
}

function buildUnknownResult(user: PolicySupportUserContext): PolicySupportResult {
  const conditionChecks: PolicyConditionCheck[] = [
    {
      item: "지역 정책",
      status: "unknown",
      note: `${user.province} ${user.district} 정책 데이터가 아직 준비되지 않았어요.`,
    },
  ];
  const inquiryInput = { user, policy: null, conditionChecks };

  return {
    overallStatus: "unknown",
    statusLabel: "지역 정책 정보 없음",
    summary: "해당 지역 정책 정보를 찾지 못했어요. 관할 보건소 직접 확인이 필요합니다.",
    conditionChecks,
    supportItems: [],
    checklistGroups: [
      {
        title: "직접 확인할 항목",
        items: ["관할 보건소 연락처 확인", "지원결정통지서 발급 가능 여부 확인"],
      },
    ],
    inquiryQuestions: generatePolicyInquiryQuestions(inquiryInput),
    inquiryDraft: generatePolicyInquiryDraft(inquiryInput),
    disclaimer:
      "Fevio는 지원 대상 여부를 확정하지 않아요. 최종 지원 여부와 금액은 관할 보건소의 확인과 지원결정통지서 발급으로 확인됩니다.",
    sources: [],
  };
}
