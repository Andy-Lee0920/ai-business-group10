import type {
  PolicyConditionCheck,
  PolicyInquiryDraft,
  PolicyStructuredPolicy,
  PolicySupportTreatmentType,
  PolicySupportUserContext,
} from "./policy-support";

type PolicyInquiryInput = {
  user: PolicySupportUserContext;
  policy: PolicyStructuredPolicy | null;
  conditionChecks: readonly PolicyConditionCheck[];
};

const TREATMENT_LABELS = {
  fresh_embryo: "체외수정 신선배아",
  frozen_embryo: "체외수정 동결배아",
  iui: "인공수정",
} as const satisfies Record<PolicySupportTreatmentType, string>;

const ATTENTION_STATUSES = new Set(["needs_check", "action_required", "risk", "unknown"]);

export function generatePolicyInquiryQuestions({
  user,
  policy,
  conditionChecks,
}: PolicyInquiryInput): string[] {
  if (!policy) {
    return ["관할 보건소에서 현재 신청 가능한 난임부부 시술비 지원 정책이 있나요?"];
  }

  const questions: string[] = [];

  if (hasAttentionCheck(conditionChecks, "예산")) {
    questions.push(`현재 ${policy.district} 난임부부 시술비 지원 예산이 남아 있나요?`);
  }

  if (hasAttentionCheck(conditionChecks, "지원결정통지서")) {
    questions.push(
      `${user.treatmentStartDate} 시작 예정인 ${getTreatmentLabel(user.treatmentType)} 시술 전에 지원결정통지서 발급이 가능한가요?`,
    );
  }

  if (hasAttentionCheck(conditionChecks, "난임진단서")) {
    questions.push("난임진단서 발급 또는 제출과 관련해 신청 전에 준비해야 할 서류가 있나요?");
  }

  if (hasAttentionCheck(conditionChecks, "지원 횟수")) {
    questions.push("기존 지원 이력 기준으로 잔여 지원 횟수를 확인할 수 있나요?");
  }

  if (hasAttentionCheck(conditionChecks, "원외약제비")) {
    questions.push("원외약제비가 발생하면 어떤 서류로 청구할 수 있나요?");
  }

  if (hasAttentionCheck(conditionChecks, "정책 데이터 신뢰도")) {
    questions.push("가장 최신 공지와 담당 부서를 어디에서 확인하면 될까요?");
  }

  questions.push("신청 시 필요한 서류와 온라인 신청 가능 여부를 확인하고 싶습니다.");

  return unique(questions);
}

export function generatePolicyInquiryDraft(input: PolicyInquiryInput): PolicyInquiryDraft {
  const questions = generatePolicyInquiryQuestions(input);
  const { user, policy } = input;

  if (!policy) {
    return {
      recipient: "",
      subject: "난임부부 시술비 지원 정책 문의드립니다",
      bodyLines: [
        "안녕하세요.",
        `${user.province} ${user.district} 거주자로 난임부부 시술비 지원 정책 확인을 요청드립니다.`,
        ...questions.map((question) => `- ${question}`),
        "감사합니다.",
      ],
    };
  }

  return {
    recipient: policy.email,
    subject: "난임부부 시술비 지원 신청 가능 여부 문의드립니다",
    bodyLines: [
      "안녕하세요.",
      `${user.province} ${user.district} 거주자로, ${getTreatmentLabel(user.treatmentType)} 시술을 ${user.treatmentStartDate}경 시작 예정입니다.`,
      "난임부부 시술비 지원 신청과 관련해 아래 항목을 확인하고 싶습니다.",
      ...questions.map((question) => `- ${question}`),
      "답변 받을 이메일: user@example.com",
      "감사합니다.",
    ],
  };
}

function hasAttentionCheck(
  conditionChecks: readonly PolicyConditionCheck[],
  item: string,
): boolean {
  return conditionChecks.some(
    (check) => check.item === item && ATTENTION_STATUSES.has(check.status),
  );
}

function getTreatmentLabel(type: PolicySupportTreatmentType): string {
  return TREATMENT_LABELS[type];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
