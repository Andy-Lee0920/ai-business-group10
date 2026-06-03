# Spec: 정책 자격 체크 엔진 구현

**버전:** v1.0.0
**작성일:** 2026-06-03
**상태:** Implemented
**참조:** [`spec-policy-support-priority.md`](./spec-policy-support-priority.md) · [`spec-rag-policy-support.md`](./spec-rag-policy-support.md)

---

## 목적

사용자의 거주지·시술 상황을 입력받아 난임 지원금 신청 가능성을 결정론적으로 분류하고, 신청 체크리스트와 보건소 문의 초안을 자동 생성한다.

AI 없이 실행되는 7개 조건 체크를 통해 `action_required / needs_check / uncertain / eligible_likely / unknown` 5단계 판정을 반환한다.

---

## 범위

- 타입 계약 (`src/types/policy-support.types.ts`)
- 도메인 엔진 (`src/domain/policy-support.ts`)
- 시드 데이터 (`src/data/policy-seed/`)
- 페이지 UI (`app/(authed)/policy-support/page.tsx`)
- 단위 테스트 (`tests/unit/policy-support-domain.test.ts`)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/types/policy-support.types.ts` | `PolicyStructuredSeed`, `UserTreatmentContext`, `EligibilityResult`, `CheckResult`, `ChecklistItem` 타입 계약 |
| `src/domain/policy-support.ts` | `evaluatePolicySupport()`, `mapPolicySeedToStructuredPolicy()` 등 도메인 함수 |
| `src/data/policy-seed/index.ts` | `getPolicySeed(sido, sigungu)` 룩업 + 폴백 |
| `src/data/policy-seed/seoul-baseline.ts` | 서울특별시 공통 기준 (자치구 폴백용) |
| `src/data/policy-seed/gangnam-gu.ts` | 강남구 시드 |
| `src/data/policy-seed/mapo-gu.ts` | 마포구 시드 (placeholder) |
| `app/(authed)/policy-support/page.tsx` | 4단계 스텝 UI (입력 → 가능성 → 체크리스트 → 문의 메일) |
| `tests/unit/policy-support-domain.test.ts` | 도메인 단위 테스트 |

---

## 타입 계약

### `PolicyStructuredSeed`

정책 원본 데이터 구조. `src/data/policy-seed/` 에서 수동 관리하며 DB 테이블(`policy_structured`) 스키마와 1:1 대응한다.

```ts
type PolicyStructuredSeed = {
  sido: string;
  sigungu: string | null;            // null = 시도 전체 기준 (폴백용)
  health_center_name: string;
  dept_name: string | null;
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
  budget_checked_at: string;         // ISO datetime
  source_url: string;
  last_verified_at: string;          // ISO datetime
  confidence: number;                // 0–1
};
```

### `UserTreatmentContext` (spec 기준) / `PolicySupportUserContext` (도메인 기준)

spec 타입과 도메인 내부 타입이 필드명 컨벤션에서 차이가 있다. 아래는 도메인 함수가 실제로 소비하는 타입이다.

```ts
type PolicySupportUserContext = {
  province: string;                              // sido
  district: string;                              // sigungu
  treatmentType: 'fresh_embryo' | 'frozen_embryo' | 'iui';
  treatmentStartDate: string;
  hasDiagnosisCertificate: boolean | 'unknown';
  hasDecisionNotice: boolean | 'unknown';
  supportAttemptCount: number | 'unknown';
  externalDrugCostExpected: boolean | 'unknown';
};
```

### `PolicySupportStatus` (종합 판정)

```ts
type PolicySupportStatus =
  | 'eligible_likely'   // 모든 조건 confirmed
  | 'needs_check'       // needs_check 1개 이상, action_required / risk 없음
  | 'action_required'   // action_required 1개 이상
  | 'uncertain'         // risk 1개 이상
  | 'unknown';          // 지역 정책 데이터 없음
```

### `PolicyConditionStatus` (항목별 판정)

```ts
type PolicyConditionStatus =
  | 'confirmed'
  | 'needs_check'
  | 'action_required'
  | 'risk'
  | 'unknown';
```

---

## 도메인 엔진

### 진입점

```ts
evaluatePolicySupport(
  user: PolicySupportUserContext,
  policy: PolicyStructuredPolicy | null
): PolicySupportResult
```

`policy`가 `null`이면 지역 데이터 없음 경로(`buildUnknownResult`)로 분기한다.

### 시드 → 도메인 정책 변환

```ts
mapPolicySeedToStructuredPolicy(
  seed: PolicyStructuredSeed,
  requestedDistrict: string
): PolicyStructuredPolicy
```

`seed.sigungu`가 `null`(서울 폴백)인 경우 `requestedDistrict`를 district로 사용하고 보건소명을 `${district} 보건소`로 구성한다.

### 조건 체크 7개

| 함수 | 체크 항목 | `action_required` 조건 |
|---|---|---|
| `checkResidence` | 거주 지역 | 입력 지역 ≠ 정책 지역 → `risk` |
| `checkTreatmentType` | 시술 유형 | 정책에 해당 유형 없음 → `risk` |
| `checkDiagnosisCertificate` | 난임진단서 | `hasDiagnosisCertificate === false` → `action_required` |
| `checkDecisionNotice` | 지원결정통지서 | `hasDecisionNotice === false` + 정책이 시술 전 통지서 요구 → `action_required` |
| `checkBudget` | 예산 | `budget_exhausted === true` → `risk` |
| `checkSupportAttempts` | 지원 횟수 | `supportAttemptCount >= maxSupportAttempts` → `risk` |
| `checkExternalDrugCost` | 원외약제비 | 해당 없음 (최대 `needs_check`) |

### 종합 판정 집계 규칙

```
action_required 1개 이상 → 'action_required'
risk 1개 이상            → 'uncertain'
needs_check 1개 이상     → 'needs_check'
unknown 1개 이상         → 'unknown'
나머지                   → 'eligible_likely'
```

### 결과 구조

```ts
type PolicySupportResult = {
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
```

`disclaimer`는 항상 고정 문구다:

> "Fevio는 지원 대상 여부를 확정하지 않아요. 최종 지원 여부와 금액은 관할 보건소의 확인과 지원결정통지서 발급으로 확인됩니다."

---

## 시드 데이터

### 구조

```
src/data/policy-seed/
├── index.ts           getPolicySeed(sido, sigungu) 룩업
├── seoul-baseline.ts  서울특별시 공통 기준 (폴백)
├── gangnam-gu.ts      강남구 (실데이터 기반)
└── mapo-gu.ts         마포구 (placeholder)
```

### 룩업 & 폴백 로직

```ts
getPolicySeed(sido, sigungu)
  → DISTRICT_SEEDS에서 (sido, sigungu) 정확 매칭
  → 없으면: sido === '서울특별시' → seoulBaseline 반환
  → 그 외: seoulBaseline 복사 + confidence: 0.5 오버라이드
```

`confidence < 0.7` 폴백 데이터는 UI에서 신뢰도 낮음 배너를 표시해야 한다 (현재 미구현, P1).

### 서울 공통 기준 주요 값

| 항목 | 값 |
|---|---|
| 신선배아 상한 | 1,100,000원 |
| 동결배아 상한 | 700,000원 |
| 인공수정 상한 | 300,000원 |
| 원외약제비 | 구별 상이 (`null`) |
| 시술 전 통지서 | 필수 |
| confidence | 0.7 (수동 검증 후 상향 필요) |

---

## 페이지 UI

### 경로

`/policy-support` (`app/(authed)/policy-support/page.tsx`)

### 4단계 스텝

| 스텝 키 | 레이블 | 내용 |
|---|---|---|
| `input` | 정보 입력 | 거주지·시술 유형·날짜·서류 보유 여부 선택 |
| `result` | 가능성 | 종합 판정 카드 + 조건별 체크 배지 |
| `checklist` | 체크리스트 | 그룹별 준비 항목 |
| `contact` | 문의 메일 | 보건소 문의 초안 |

### 상태 관리

- `activeStep`: 현재 스텝
- `selectedParams`: 입력 파라미터 (기본값: 강남구 / 신선배아 / 2026-06-10 / 통지서 없음)
- `userContext`, `policy`, `policyResult`: `useMemo` 파생 — 입력 변경 시 자동 재계산

### 기본 파라미터 (Default)

```ts
{
  district: '강남구',
  treatment: 'fresh_embryo',
  start: '2026년 6월 10일',
  diagnosis: 'yes',
  notice: 'no',        // → action_required 발생
  budget: 'unknown',
  attempts: 'unknown',
  drug: 'unknown',
}
```

---

## 단위 테스트

`tests/unit/policy-support-domain.test.ts` — 4개 케이스

| 테스트 | 검증 내용 |
|---|---|
| `maps structured policy seed data` | `mapPolicySeedToStructuredPolicy` — gangnam-gu 시드 → 도메인 정책 변환 정확성 |
| `keeps the requested district when Seoul baseline fallback` | 폴백 시 `district` / `healthCenter` / `sources[0].label` 이 요청 자치구로 치환됨 |
| `flags a missing decision notice as pre-treatment action` | 통지서 없음 → `overallStatus: 'action_required'`, `statusLabel: '시술 전 확인 필요'` |
| `returns unknown when regional policy data is missing` | `policy: null` → `overallStatus: 'unknown'`, `conditionChecks[0].item: '지역 정책'` |
| `keeps generated copy away from final eligibility claims` | 직렬화 결과에 금지 표현 미포함 확인 |

---

## 금지 표현 원칙

도메인 함수가 생성하는 모든 문자열은 아래 표현을 포함해서는 안 된다.

```
지원 대상입니다
100% 받을 수 있습니다
무조건 신청 가능합니다
반드시 지원됩니다
확실히 받을 수
이미 확정
```

테스트 `keeps generated copy away from final eligibility claims`가 이를 회귀 방어한다.

---

## 미구현 항목 (P1 / P2)

| 항목 | 우선순위 | 비고 |
|---|---|---|
| `confidence < 0.7` 폴백 배너 | P1 | UI에 신뢰도 낮음 표시 미구현 |
| LLM 문의 초안 생성 | P1 | 현재 정적 템플릿으로 대체 |
| 서울 외 시도 시드 | P2 | 현재 confidence 0.5 폴백 |
| 체크리스트 → CareActionCard 승격 | P2 | 사용자 확인 트리거 미구현 |
| RAG 벡터 검색 (pgvector) | P2 | `spec-rag-policy-support.md` 참조 |
