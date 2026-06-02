"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, ScreenShell } from "../../../src/components/ui";
import {
  evaluatePolicySupport,
  getTreatmentLabel,
  type PolicyConditionStatus,
  type PolicyStructuredPolicy,
  type PolicySupportResult,
  type PolicySupportTreatmentType,
  type PolicySupportUserContext,
} from "../../../src/domain/policy-support";

type PolicySupportStep = "input" | "result" | "checklist" | "contact";

type PolicySupportInputState = {
  district?: string;
  treatment?: string;
  start?: string;
  diagnosis?: string;
  notice?: string;
  budget?: string;
  attempts?: string;
  drug?: string;
};

const STEPS = [
  { key: "input", label: "정보 입력" },
  { key: "result", label: "가능성" },
  { key: "checklist", label: "체크리스트" },
  { key: "contact", label: "문의 메일" },
] as const satisfies readonly { key: PolicySupportStep; label: string }[];

const DEFAULT_PARAMS = {
  district: "강남구",
  treatment: "fresh_embryo",
  start: "2026년 6월 10일",
  diagnosis: "yes",
  notice: "no",
  budget: "unknown",
  attempts: "unknown",
  drug: "unknown",
} as const satisfies Required<PolicySupportInputState>;

const mockPolicy = {
  province: "서울특별시",
  district: "강남구",
  healthCenter: "강남구보건소",
  department: "건강관리과 모자보건팀",
  phone: "02-3423-7104",
  email: "familycare@gangnam.example.kr",
  supportedTreatmentTypes: ["fresh_embryo", "frozen_embryo", "iui"],
  requireDiagnosisCertificate: true,
  requireDecisionNoticeBeforeTreatment: true,
  budgetStatus: "unknown",
  maxSupportAttempts: "unknown",
  supportItems: [
    { label: "예상 지원 항목", value: "신선배아 시술비 일부" },
    { label: "지원 가능성이 있는 항목", value: "일부 비급여 및 원외약제비" },
    { label: "확인 필요", value: "배아동결비, 약제비 청구 방식" },
    { label: "제외 가능성", value: "통지서 전 발생 비용" },
  ],
  sources: [
    {
      label: "강남구 난임부부 시술비 지원 안내",
      url: "https://example.go.kr/ivf-support/gangnam",
      lastVerifiedAt: "2026년 6월 1일",
    },
  ],
} as const satisfies PolicyStructuredPolicy;

export default function PolicySupportPage() {
  const [activeStep, setActiveStep] = useState<PolicySupportStep>("input");
  const [selectedParams, setSelectedParams] = useState<
    Required<PolicySupportInputState>
  >(DEFAULT_PARAMS);
  const userContext = useMemo(
    () => buildUserContext(selectedParams),
    [selectedParams],
  );
  const policy = useMemo(() => buildPolicy(selectedParams), [selectedParams]);
  const policyResult = useMemo(
    () => evaluatePolicySupport(userContext, policy),
    [policy, userContext],
  );

  return (
    <ScreenShell>
      <header style={{ marginBottom: 20 }}>
        <Link href="/settings" style={backLinkStyle}>
          ← 설정
        </Link>
        <p style={eyebrowStyle}>지역별 난임지원 RAG</p>
        <h1 style={titleStyle}>지원금 행정 액션</h1>
      </header>

      <nav aria-label="지원금 확인 단계" style={stepNavStyle}>
        {STEPS.map((step) => (
          <button
            key={step.key}
            aria-current={activeStep === step.key ? "step" : undefined}
            onClick={() => setActiveStep(step.key)}
            style={stepLinkStyle(activeStep === step.key)}
            type="button"
          >
            {step.label}
          </button>
        ))}
      </nav>

      {activeStep === "input" ? (
        <InputScreen
          params={selectedParams}
          setActiveStep={setActiveStep}
          setParams={setSelectedParams}
        />
      ) : null}
      {activeStep === "result" ? (
        <ResultScreen
          policy={policy}
          result={policyResult}
          setActiveStep={setActiveStep}
        />
      ) : null}
      {activeStep === "checklist" ? (
        <ChecklistScreen result={policyResult} setActiveStep={setActiveStep} />
      ) : null}
      {activeStep === "contact" ? (
        <ContactScreen policy={policy} result={policyResult} />
      ) : null}

      <section style={noticeStyle} aria-label="안전 안내">
        <Badge tone="sage">보건소 최종 확인 필요</Badge>
        <p style={noticeTextStyle}>
          Fevio는 지원 대상 여부를 확정하지 않아요. 최종 지원 여부와 금액은 관할
          보건소의 확인과 지원결정통지서 발급으로 확인됩니다.
        </p>
      </section>
    </ScreenShell>
  );
}

function InputScreen({
  params,
  setActiveStep,
  setParams,
}: {
  params: Required<PolicySupportInputState>;
  setActiveStep: (step: PolicySupportStep) => void;
  setParams: (params: Required<PolicySupportInputState>) => void;
}) {
  return (
    <>
      <section style={cardStyle} aria-label="지원금 상태 입력">
        <h2 style={cardTitleStyle}>지원금 상태 입력</h2>
        <div style={choiceFormStyle}>
          <DistrictDropdown params={params} setParams={setParams} />
          <ChoiceGroup
            label="시술 유형"
            name="treatment"
            params={params}
            setParams={setParams}
            options={[
              { value: "fresh_embryo", label: "신선배아", description: "체외수정" },
              { value: "frozen_embryo", label: "동결배아", description: "체외수정" },
              { value: "iui", label: "인공수정", description: "IUI" },
            ]}
          />
          <ChoiceGroup
            label="시술 시작 예정일"
            name="start"
            params={params}
            setParams={setParams}
            options={[
              { value: "2026년 6월 10일", label: "6월 10일", description: "시술 전 확인 가능" },
              { value: "2026년 6월 3일", label: "6월 3일", description: "가까운 일정" },
              { value: "모름", label: "아직 모름", description: "보건소 문의 우선" },
            ]}
          />
          <ChoiceGroup
            label="난임진단서"
            name="diagnosis"
            params={params}
            setParams={setParams}
            options={[
              { value: "yes", label: "있음", description: "준비됨" },
              { value: "no", label: "없음", description: "준비 필요" },
              { value: "unknown", label: "모름", description: "확인 필요" },
            ]}
          />
          <ChoiceGroup
            label="지원결정통지서"
            name="notice"
            params={params}
            setParams={setParams}
            options={[
              { value: "yes", label: "있음", description: "발급됨" },
              { value: "no", label: "없음", description: "시술 전 확인" },
              { value: "unknown", label: "모름", description: "발급 여부 확인" },
            ]}
          />
          <ChoiceGroup
            label="예산 잔여 여부"
            name="budget"
            params={params}
            setParams={setParams}
            options={[
              { value: "available", label: "접수 가능", description: "확인된 경우" },
              { value: "unknown", label: "모름", description: "보건소 확인" },
              { value: "exhausted", label: "소진 가능", description: "위험 확인" },
            ]}
          />
          <ChoiceGroup
            label="기존 지원 이력"
            name="attempts"
            params={params}
            setParams={setParams}
            options={[
              { value: "0", label: "처음", description: "첫 신청" },
              { value: "1", label: "1회", description: "잔여 횟수 확인" },
              { value: "unknown", label: "모름", description: "보건소 확인" },
            ]}
          />
          <ChoiceGroup
            label="원외약제비"
            name="drug"
            params={params}
            setParams={setParams}
            options={[
              { value: "yes", label: "있을 수 있음", description: "청구 서류 확인" },
              { value: "no", label: "없음", description: "현재 해당 없음" },
              { value: "unknown", label: "모름", description: "발생 시 확인" },
            ]}
          />
        </div>
      </section>
      <StepCta
        label="지원 가능성 확인하기"
        onClick={() => setActiveStep("result")}
      />
    </>
  );
}

function ResultScreen({
  policy,
  result,
  setActiveStep,
}: {
  policy: PolicyStructuredPolicy;
  result: PolicySupportResult;
  setActiveStep: (step: PolicySupportStep) => void;
}) {
  return (
    <>
      <section style={statusCardStyle} aria-label="내 지원금 상태">
        <Badge tone={result.overallStatus === "action_required" ? "coral" : "lavender"}>
          {result.statusLabel}
        </Badge>
        <h2 style={statusTitleStyle}>{result.summary}</h2>
        <p style={statusBodyStyle}>
          다만 통지서 발급 가능 여부와 예산 잔여 여부는{" "}
          {policy.healthCenter} 확인이 필요합니다.
        </p>
      </section>

      <InfoCard
        title="확인된 조건"
        items={result.conditionChecks
          .filter((check) => check.status === "confirmed")
          .map((check) => check.note)}
      />
      <InfoCard
        title="확인이 필요한 조건"
        items={result.conditionChecks
          .filter((check) => isAttentionStatus(check.status))
          .map((check) => check.note)}
        tone="warning"
      />

      <section style={cardStyle} aria-label="지원 항목">
        <h2 style={cardTitleStyle}>지원 항목 카드</h2>
        <div style={miniCardGridStyle}>
          {result.supportItems.map((item) => (
            <MiniStatus key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </section>

      <section style={sourceStyle} aria-label="정책 출처">
        {result.sources.map((source) => (
          <span key={source.url}>
            출처: {source.label} ({source.url}) · 마지막 확인일:{" "}
            {source.lastVerifiedAt}
          </span>
        ))}
      </section>
      <StepCta
        label="신청 체크리스트 보기"
        onClick={() => setActiveStep("checklist")}
      />
    </>
  );
}

function ChecklistScreen({
  result,
  setActiveStep,
}: {
  result: PolicySupportResult;
  setActiveStep: (step: PolicySupportStep) => void;
}) {
  return (
    <>
      {result.checklistGroups.map((group) => (
        <InfoCard key={group.title} title={group.title} items={group.items} />
      ))}
      <section style={noticeStyle} aria-label="통지서 액션">
        <Badge tone="coral">시술 시작 전 확인</Badge>
        <p style={noticeTextStyle}>
          지원결정통지서가 필요한 경우, 시술 시작 전에 신청과 발급 가능 여부를
          확인하는 것이 안전합니다.
        </p>
      </section>
      <StepCta
        label="보건소 문의 메일 만들기"
        onClick={() => setActiveStep("contact")}
      />
    </>
  );
}

function ContactScreen({
  policy,
  result,
}: {
  policy: PolicyStructuredPolicy;
  result: PolicySupportResult;
}) {
  return (
    <>
      <section style={cardStyle} aria-label="관할 보건소">
        <h2 style={cardTitleStyle}>{policy.healthCenter}</h2>
        <p style={cardBodyStyle}>{policy.department}</p>
        <div style={fieldGridStyle}>
          <ReadOnlyField label="전화" value={policy.phone} />
          <ReadOnlyField label="이메일" value={policy.email} />
        </div>
      </section>

      <InfoCard title="추천 문의" items={result.inquiryQuestions} tone="warning" />

      <section style={emailCardStyle} aria-label="문의 메일 초안">
        <h2 style={cardTitleStyle}>문의 메일 초안</h2>
        <p style={emailMetaStyle}>받는 사람: {result.inquiryDraft.recipient}</p>
        <p style={emailMetaStyle}>
          제목: {result.inquiryDraft.subject}
        </p>
        <div style={emailBodyStyle}>
          {result.inquiryDraft.bodyLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section style={noticeStyle} aria-label="민감정보 제외 안내">
        <Badge tone="sage">민감정보 제외</Badge>
        <p style={noticeTextStyle}>
          주민등록번호, 상세 진단명, 배우자 개인정보, 병원명, 검사 수치,
          진단서나 비용 증빙 이미지는 메일 초안에 넣지 않았어요.
        </p>
      </section>
    </>
  );
}

const SEOUL_DISTRICTS = [
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
] as const;

function DistrictDropdown({
  params,
  setParams,
}: {
  params: Required<PolicySupportInputState>;
  setParams: (params: Required<PolicySupportInputState>) => void;
}) {
  return (
    <label style={selectGroupStyle}>
      <span style={choiceLegendStyle}>거주 지역</span>
      <span style={selectWrapStyle}>
        <select
          aria-label="서울 자치구 선택"
          onChange={(event) =>
            setParams({ ...params, district: event.currentTarget.value })
          }
          style={selectStyle}
          value={params.district}
        >
          {SEOUL_DISTRICTS.map((district) => (
            <option key={district} value={district}>
              서울특별시 {district}
            </option>
          ))}
        </select>
        <span aria-hidden="true" style={selectArrowStyle}>
          ▾
        </span>
      </span>
    </label>
  );
}

function ChoiceGroup({
  label,
  name,
  options,
  params,
  setParams,
}: {
  label: string;
  name: keyof Required<PolicySupportInputState>;
  options: readonly {
    value: string;
    label: string;
    description: string;
  }[];
  params: Required<PolicySupportInputState>;
  setParams: (params: Required<PolicySupportInputState>) => void;
}) {
  return (
    <fieldset style={choiceGroupStyle}>
      <legend style={choiceLegendStyle}>{label}</legend>
      <div style={choiceOptionGridStyle(options.length)}>
        {options.map((option) => {
          const selected = params[name] === option.value;

          return (
            <button
              aria-pressed={selected}
              key={option.value}
              onClick={() => setParams({ ...params, [name]: option.value })}
              style={choiceOptionStyle(selected)}
              type="button"
            >
              <span style={choiceTextStyle}>
                <strong style={choiceLabelStyle}>{option.label}</strong>
                <span style={choiceDescriptionStyle}>{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <strong style={fieldValueStyle}>{value}</strong>
    </div>
  );
}

function InfoCard({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: readonly string[];
  tone?: "default" | "warning";
}) {
  return (
    <section
      style={tone === "warning" ? warningCardStyle : cardStyle}
      aria-label={title}
    >
      <h2 style={cardTitleStyle}>{title}</h2>
      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniStatusStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <strong style={miniStatusValueStyle}>{value}</strong>
    </div>
  );
}

function StepCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={primaryButtonStyle} type="button">
      {label}
    </button>
  );
}

function buildUserContext(
  params: Required<PolicySupportInputState>,
): PolicySupportUserContext {
  return {
    province: "서울특별시",
    district: params.district,
    treatmentType: params.treatment as PolicySupportTreatmentType,
    treatmentStartDate: params.start,
    hasDiagnosisCertificate: parseYesNoUnknown(params.diagnosis),
    hasDecisionNotice: parseYesNoUnknown(params.notice),
    supportAttemptCount:
      params.attempts === "unknown" ? "unknown" : Number(params.attempts),
    externalDrugCostExpected: parseYesNoUnknown(params.drug),
  };
}

function buildPolicy(
  params: Required<PolicySupportInputState>,
): PolicyStructuredPolicy {
  return {
    ...mockPolicy,
    budgetStatus: params.budget as PolicyStructuredPolicy["budgetStatus"],
  };
}

function parseYesNoUnknown(value: string): boolean | "unknown" {
  if (value === "yes") return true;
  if (value === "no") return false;
  return "unknown";
}

function isAttentionStatus(status: PolicyConditionStatus): boolean {
  return (
    status === "needs_check" ||
    status === "action_required" ||
    status === "risk" ||
    status === "unknown"
  );
}

const backLinkStyle = {
  color: "var(--slc-muted)",
  display: "inline-flex",
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 18,
  textDecoration: "none",
} as const;

const eyebrowStyle = {
  color: "var(--fevio-sage-dark)",
  fontSize: 12,
  fontWeight: 900,
  margin: "0 0 7px",
} as const;

const titleStyle = {
  color: "var(--slc-text)",
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  lineHeight: 1.12,
  margin: "0 0 10px",
} as const;

const stepNavStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  marginBottom: 14,
} as const;

function stepLinkStyle(active: boolean) {
  return {
    alignItems: "center",
    background: active ? "#D4622A" : "rgba(255, 255, 255, 0.86)",
    border: active ? "1px solid #D4622A" : "1px solid #F1D7C8",
    borderRadius: 12,
    color: active ? "#fff" : "#9A5A36",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 900,
    justifyContent: "center",
    minHeight: 42,
    padding: "8px 6px",
    textAlign: "center",
  } as const;
}

const noticeStyle = {
  background: "rgba(255, 244, 237, 0.88)",
  borderRadius: 18,
  marginBottom: 14,
  padding: "16px",
} as const;

const noticeTextStyle = {
  color: "var(--slc-text)",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.55,
  margin: "10px 0 0",
} as const;

const cardStyle = {
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #F0D6C7",
  borderRadius: 18,
  marginBottom: 14,
  padding: "18px 16px",
} as const;

const warningCardStyle = {
  ...cardStyle,
  background: "#FFF8F5",
  border: "1px solid #F4C9B8",
} as const;

const statusCardStyle = {
  background:
    "linear-gradient(180deg, rgba(255, 247, 241, 0.98) 0%, rgba(255, 255, 255, 0.94) 100%)",
  border: "1px solid #F0CBB8",
  borderRadius: 18,
  marginBottom: 14,
  padding: "18px 16px",
} as const;

const cardTitleStyle = {
  color: "var(--slc-text)",
  fontSize: 17,
  fontWeight: 950,
  margin: "0 0 8px",
} as const;

const statusTitleStyle = {
  color: "var(--slc-text)",
  fontSize: 19,
  fontWeight: 950,
  lineHeight: 1.32,
  margin: "12px 0 8px",
} as const;

const cardBodyStyle = {
  color: "var(--slc-muted)",
  fontSize: 14,
  lineHeight: 1.55,
  margin: 0,
} as const;

const statusBodyStyle = {
  color: "var(--slc-muted)",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.55,
  margin: 0,
} as const;

const listStyle = {
  color: "var(--slc-text)",
  display: "grid",
  fontSize: 14,
  fontWeight: 800,
  gap: 8,
  lineHeight: 1.45,
  margin: 0,
  paddingLeft: 18,
} as const;

const fieldGridStyle = {
  display: "grid",
  gap: 10,
  marginTop: 14,
} as const;

const choiceFormStyle = {
  display: "grid",
  gap: 17,
  marginTop: 16,
} as const;

const selectGroupStyle = {
  display: "grid",
  gap: 9,
} as const;

const selectWrapStyle = {
  position: "relative",
} as const;

const selectStyle = {
  appearance: "none",
  background: "#FFF7F1",
  border: "1.5px solid #E8A078",
  borderRadius: 14,
  color: "#6E351C",
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 950,
  minHeight: 50,
  outline: "none",
  padding: "0 42px 0 14px",
  width: "100%",
} as const;

const selectArrowStyle = {
  color: "#C65F2C",
  fontSize: 16,
  fontWeight: 950,
  pointerEvents: "none",
  position: "absolute",
  right: 15,
  top: "50%",
  transform: "translateY(-50%)",
} as const;

const choiceGroupStyle = {
  border: 0,
  display: "grid",
  gap: 9,
  margin: 0,
  padding: 0,
} as const;

const choiceLegendStyle = {
  color: "var(--slc-text)",
  fontSize: 14,
  fontWeight: 950,
  lineHeight: 1.25,
  marginBottom: 1,
  padding: 0,
} as const;

function choiceOptionGridStyle(optionCount: number) {
  return {
    display: "grid",
    gap: 8,
    gridTemplateColumns:
      optionCount === 2 ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
  } as const;
}

function choiceOptionStyle(selected: boolean) {
  return {
    background: selected ? "#D4622A" : "#FFF7F1",
    border: selected
      ? "1.5px solid #D4622A"
      : "1px solid #F0D2C1",
    borderRadius: 14,
    boxShadow: selected ? "0 8px 18px rgba(212, 98, 42, 0.18)" : "none",
    color: selected ? "#fff" : "#71391F",
    cursor: "pointer",
    display: "grid",
    fontFamily: "inherit",
    minHeight: 70,
    padding: "12px 10px",
    textAlign: "left",
  } as const;
}

const choiceTextStyle = {
  display: "grid",
  gap: 3,
  minWidth: 0,
} as const;

const choiceLabelStyle = {
  fontSize: 14,
  fontWeight: 950,
  lineHeight: 1.25,
} as const;

const choiceDescriptionStyle = {
  fontSize: 11,
  fontWeight: 850,
  lineHeight: 1.28,
  opacity: 0.86,
} as const;

const fieldStyle = {
  background: "rgba(246, 242, 236, 0.72)",
  borderRadius: 14,
  display: "grid",
  gap: 4,
  padding: "12px 13px",
} as const;

const fieldLabelStyle = {
  color: "var(--slc-muted)",
  fontSize: 12,
  fontWeight: 900,
} as const;

const fieldValueStyle = {
  color: "var(--slc-text)",
  fontSize: 15,
  fontWeight: 950,
} as const;

const miniCardGridStyle = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
} as const;

const miniStatusStyle = {
  background: "rgba(246, 242, 236, 0.72)",
  borderRadius: 14,
  display: "grid",
  gap: 7,
  minHeight: 96,
  padding: "13px",
} as const;

const miniStatusValueStyle = {
  color: "var(--slc-text)",
  fontSize: 14,
  fontWeight: 950,
  lineHeight: 1.35,
} as const;

const sourceStyle = {
  color: "var(--slc-muted)",
  display: "grid",
  fontSize: 12,
  fontWeight: 800,
  gap: 5,
  lineHeight: 1.35,
  margin: "0 0 14px",
  overflowWrap: "anywhere",
  padding: "0 4px",
} as const;

const emailCardStyle = {
  ...cardStyle,
  background: "rgba(255, 252, 247, 0.96)",
} as const;

const emailMetaStyle = {
  color: "var(--slc-muted)",
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.45,
  margin: "0 0 8px",
} as const;

const emailBodyStyle = {
  background: "#fff",
  border: "1px solid var(--slc-border)",
  borderRadius: 14,
  color: "var(--slc-text)",
  fontSize: 14,
  fontWeight: 750,
  lineHeight: 1.6,
  marginTop: 12,
  padding: "14px",
} as const;

const primaryButtonStyle = {
  alignItems: "center",
  background: "var(--slc-coral-gradient)",
  border: "none",
  borderRadius: 999,
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 900,
  justifyContent: "center",
  marginTop: 18,
  minHeight: 52,
  width: "100%",
} as const;
