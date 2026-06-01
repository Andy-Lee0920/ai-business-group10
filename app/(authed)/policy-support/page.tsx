import Link from "next/link";
import { Badge, ScreenShell } from "../../../src/components/ui";

type PolicySupportStep = "input" | "result" | "checklist" | "contact";

type PageProps = {
  searchParams?: Promise<{ step?: string }>;
};

const STEPS = [
  { key: "input", label: "정보 입력" },
  { key: "result", label: "가능성" },
  { key: "checklist", label: "체크리스트" },
  { key: "contact", label: "문의 메일" },
] as const satisfies readonly { key: PolicySupportStep; label: string }[];

const mockProfile = {
  province: "서울특별시",
  district: "강남구",
  healthCenter: "강남구보건소",
  department: "건강관리과 모자보건팀",
  phone: "02-3423-7104",
  email: "familycare@gangnam.example.kr",
  treatmentType: "체외수정 신선배아",
  treatmentStartDate: "2026년 6월 10일",
  diagnosisCertificate: "있음",
  decisionNotice: "없음",
  budgetStatus: "모름",
  lastVerifiedAt: "2026년 6월 1일",
  sourceUrl: "https://example.go.kr/ivf-support/gangnam",
};

const confirmedConditions = [
  "거주 지역이 서울특별시 강남구로 입력되어 있어요.",
  "시술 유형이 체외수정 신선배아로 선택되어 있어요.",
  "난임진단서를 보유한 상태로 표시되어 있어요.",
];

const needsCheckConditions = [
  "시술 시작 전 지원결정통지서 발급 가능 여부",
  "강남구 예산 잔여 여부와 접수 가능 상태",
  "부부 기준 제출 서류와 사실혼/혼인 확인 서류 필요 여부",
  "원외약제비 청구 가능 여부와 사후 제출 방식",
];

const checklistGroups = [
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
  {
    title: "원외약제비가 있다면",
    items: [
      "처방전 보관",
      "약제비 영수증 보관",
      "청구 가능 기간과 제출처 확인",
    ],
  },
];

const suggestedQuestions = [
  "현재 강남구 난임부부 시술비 지원 예산이 남아 있나요?",
  "2026년 6월 10일 시작 예정인 신선배아 시술 전에 지원결정통지서 발급이 가능한가요?",
  "신청 시 필요한 서류와 온라인 신청 가능 여부를 확인하고 싶습니다.",
  "원외약제비가 발생하면 어떤 서류로 청구할 수 있나요?",
];

export default async function PolicySupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeStep = normalizeStep(params?.step);

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
          <Link
            key={step.key}
            href={`/policy-support?step=${step.key}`}
            aria-current={activeStep === step.key ? "step" : undefined}
            style={stepLinkStyle(activeStep === step.key)}
          >
            {step.label}
          </Link>
        ))}
      </nav>

      {activeStep === "input" ? <InputScreen /> : null}
      {activeStep === "result" ? <ResultScreen /> : null}
      {activeStep === "checklist" ? <ChecklistScreen /> : null}
      {activeStep === "contact" ? <ContactScreen /> : null}

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

function InputScreen() {
  return (
    <>
      <section style={cardStyle} aria-label="지원금 상태 입력">
        <h2 style={cardTitleStyle}>지원금 상태 입력</h2>
        <div style={fieldGridStyle}>
          <ReadOnlyField
            label="거주 지역"
            value={`${mockProfile.province} ${mockProfile.district}`}
          />
          <ReadOnlyField label="시술 유형" value={mockProfile.treatmentType} />
          <ReadOnlyField
            label="시술 시작 예정일"
            value={mockProfile.treatmentStartDate}
          />
          <ReadOnlyField
            label="난임진단서"
            value={mockProfile.diagnosisCertificate}
          />
          <ReadOnlyField
            label="지원결정통지서"
            value={mockProfile.decisionNotice}
          />
          <ReadOnlyField
            label="예산 잔여 여부"
            value={mockProfile.budgetStatus}
          />
        </div>
      </section>
      <StepCta
        href="/policy-support?step=result"
        label="지원 가능성 확인하기"
      />
    </>
  );
}

function ResultScreen() {
  return (
    <>
      <section style={statusCardStyle} aria-label="내 지원금 상태">
        <Badge tone="lavender">신청 검토 가능성 있음</Badge>
        <h2 style={statusTitleStyle}>
          현재 입력 정보 기준으로 지원 신청을 검토할 수 있는 상태예요.
        </h2>
        <p style={statusBodyStyle}>
          다만 통지서 발급 가능 여부와 예산 잔여 여부는{" "}
          {mockProfile.healthCenter} 확인이 필요합니다.
        </p>
      </section>

      <InfoCard title="확인된 조건" items={confirmedConditions} />
      <InfoCard
        title="확인이 필요한 조건"
        items={needsCheckConditions}
        tone="warning"
      />

      <section style={cardStyle} aria-label="지원 항목">
        <h2 style={cardTitleStyle}>지원 항목 카드</h2>
        <div style={miniCardGridStyle}>
          <MiniStatus label="예상 지원 항목" value="신선배아 시술비 일부" />
          <MiniStatus
            label="지원 가능성이 있는 항목"
            value="일부 비급여 및 원외약제비"
          />
          <MiniStatus label="확인 필요" value="배아동결비, 약제비 청구 방식" />
          <MiniStatus label="제외 가능성" value="통지서 전 발생 비용" />
        </div>
      </section>

      <section style={sourceStyle} aria-label="정책 출처">
        <span>출처: {mockProfile.sourceUrl}</span>
        <span>마지막 확인일: {mockProfile.lastVerifiedAt}</span>
      </section>
      <StepCta
        href="/policy-support?step=checklist"
        label="신청 체크리스트 보기"
      />
    </>
  );
}

function ChecklistScreen() {
  return (
    <>
      {checklistGroups.map((group) => (
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
        href="/policy-support?step=contact"
        label="보건소 문의 메일 만들기"
      />
    </>
  );
}

function ContactScreen() {
  return (
    <>
      <section style={cardStyle} aria-label="관할 보건소">
        <h2 style={cardTitleStyle}>{mockProfile.healthCenter}</h2>
        <p style={cardBodyStyle}>{mockProfile.department}</p>
        <div style={fieldGridStyle}>
          <ReadOnlyField label="전화" value={mockProfile.phone} />
          <ReadOnlyField label="이메일" value={mockProfile.email} />
        </div>
      </section>

      <InfoCard title="추천 문의" items={suggestedQuestions} tone="warning" />

      <section style={emailCardStyle} aria-label="문의 메일 초안">
        <h2 style={cardTitleStyle}>문의 메일 초안</h2>
        <p style={emailMetaStyle}>받는 사람: {mockProfile.email}</p>
        <p style={emailMetaStyle}>
          제목: 난임부부 시술비 지원 신청 가능 여부 문의드립니다
        </p>
        <div style={emailBodyStyle}>
          <p>안녕하세요.</p>
          <p>
            {mockProfile.province} {mockProfile.district} 거주자로,{" "}
            {mockProfile.treatmentType} 시술을 {mockProfile.treatmentStartDate}
            경 시작 예정입니다.
          </p>
          <p>
            난임부부 시술비 지원 신청과 관련해 예산 잔여 여부, 지원결정통지서
            발급 가능 여부, 필요 서류, 원외약제비 청구 가능 여부를 확인하고
            싶습니다.
          </p>
          <p>답변 받을 이메일: user@example.com</p>
          <p>감사합니다.</p>
        </div>
      </section>

      <section style={noticeStyle} aria-label="민감정보 제외 안내">
        <Badge tone="sage">민감정보 제외</Badge>
        <p style={noticeTextStyle}>
          주민등록번호, 상세 진단명, 배우자 개인정보, 병원명, 검사 수치,
          진단서나 영수증 이미지는 메일 초안에 넣지 않았어요.
        </p>
      </section>
    </>
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

function StepCta({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={primaryLinkStyle}>
      {label}
    </Link>
  );
}

function normalizeStep(value: string | undefined): PolicySupportStep {
  if (value === "result" || value === "checklist" || value === "contact")
    return value;
  return "input";
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

const leadStyle = {
  color: "var(--slc-muted)",
  fontSize: 15,
  lineHeight: 1.55,
  margin: 0,
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
    background: active ? "var(--slc-coral)" : "rgba(255, 255, 255, 0.82)",
    border: active
      ? "1px solid var(--slc-coral)"
      : "1px solid var(--slc-border)",
    borderRadius: 14,
    color: active ? "#fff" : "var(--slc-muted)",
    display: "flex",
    fontSize: 12,
    fontWeight: 900,
    justifyContent: "center",
    minHeight: 42,
    padding: "8px 6px",
    textAlign: "center",
    textDecoration: "none",
  } as const;
}

const noticeStyle = {
  background: "rgba(232, 243, 236, 0.82)",
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
  background: "rgba(255, 255, 255, 0.9)",
  border: "1px solid var(--slc-border)",
  borderRadius: 18,
  marginBottom: 14,
  padding: "18px 16px",
} as const;

const warningCardStyle = {
  ...cardStyle,
  background: "#FFF8F5",
  border: "1px solid #F4D4C8",
} as const;

const statusCardStyle = {
  background:
    "linear-gradient(180deg, rgba(246, 242, 252, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)",
  border: "1px solid rgba(205, 190, 225, 0.72)",
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

const primaryLinkStyle = {
  alignItems: "center",
  background: "var(--slc-coral-gradient)",
  borderRadius: 999,
  color: "#fff",
  display: "flex",
  fontSize: 16,
  fontWeight: 900,
  justifyContent: "center",
  marginTop: 18,
  minHeight: 52,
  textDecoration: "none",
} as const;
