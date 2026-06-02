# Spec: 지원금 행정 액션 — 구현 우선순위

**버전:** v1.0.0  
**작성일:** 2026-06-02  
**상태:** Active  
**참조:** [`spec-rag-policy-support.md`](./spec-rag-policy-support.md) (기술 레퍼런스)

---

## 개요

`/policy-support`는 사용자가 거주지·시술 상황을 입력하면 난임 지원금 신청 가능성을 분류 카드로 보여주고, 신청 체크리스트와 보건소 문의 초안을 자동 생성하는 기능이다.

AI는 최종 판단자가 아니라 **설명자**다. 모든 결정 경로는 "보건소 확인 필요"로 귀결된다.

---

## 구현 우선순위

### P0 — 없으면 기능이 성립하지 않는 것

| # | 항목 | 설명 |
|---|------|------|
| P0-1 | 사용자 상황 입력 | 거주지, 시술 유형, 시술 예정일, 난임진단서·지원결정통지서 보유 여부 |
| P0-2 | 정책 구조화 데이터 | `policy_structured` 테이블 — 서울 25개 자치구 수동 입력 |
| P0-3 | 결정론적 자격 체크 엔진 | 8개 조건 코드 체크, AI 없이 실행 |
| P0-4 | 가능성 카드 출력 | `confirmed / needs_check / action_required / risk / unknown` 5종 |
| P0-5 | 금지 표현 필터 | 서버사이드 — "지원 대상입니다" 등 확정 표현 차단 |
| P0-6 | 면책 문구 고정 표시 | 모든 결과 화면 하단 — 보건소 최종 확인 필요 |

### P1 — MVP 완성에 필요한 것

| # | 항목 | 설명 |
|---|------|------|
| P1-1 | 신청 체크리스트 자동 생성 | 자격 체크 결과 기반 항목별 우선순위 |
| P1-2 | 보건소 문의 초안 생성 | LLM — 민감정보 제외, 확인 질문 자동 정리 |
| P1-3 | 출처 URL · 마지막 확인일 표시 | 모든 결과에 `source_url`, `last_verified_at` 노출 |
| P1-4 | 긴급 배너 | `action_required` 항목 존재 시 상단 강조 |
| P1-5 | RLS — couple-scoped 보호 | 사용자 의료·행정 데이터 격리 |

### P2 — 이후 릴리즈

| # | 항목 | 설명 |
|---|------|------|
| P2-1 | RAG 벡터 검색 | pgvector — 구조화 데이터 보완 |
| P2-2 | 자동 크롤러 | 정부24, e보건소 정책 문서 자동 수집 |
| P2-3 | Fevio care loop 연결 | 정책 결과 → `CareActionCard` 변환 → 홈 화면 표시 |
| P2-4 | 파트너 공유 | sanitized 액션("서류 준비 도움")만 파트너에 공유 |
| P2-5 | 알림 | D-7, D-3, D-1 체크리스트 푸시 |
| P2-6 | 메일 직접 발송 | 외부 메일 앱 연동 또는 클립보드 복사 |

---

## P0-1: 사용자 상황 입력

### 입력 필드

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| `sido` | `string` | Y | 시·도 선택 |
| `sigungu` | `string` | Y | 시·군·구 선택 |
| `treatment_type` | `'ivf_fresh' \| 'ivf_frozen' \| 'iui' \| 'unknown'` | Y | |
| `treatment_start_date` | `Date \| null` | N | 없으면 `check_timing` → `needs_check` |
| `has_infertility_diagnosis` | `boolean` | Y | |
| `has_decision_notice` | `boolean` | Y | |
| `support_attempt_count` | `number` | N | 기본값 0 |
| `drug_external_occurred` | `boolean \| null` | N | 원외약제비 발생 여부 |

### 타입 계약

```ts
type UserTreatmentContext = {
  sido: string;
  sigungu: string;
  treatment_type: 'ivf_fresh' | 'ivf_frozen' | 'iui' | 'unknown';
  treatment_start_date: string | null; // ISO date
  has_infertility_diagnosis: boolean;
  has_decision_notice: boolean;
  support_attempt_count: number;
  drug_external_occurred: boolean | null;
};
```

---

## P0-2: 정책 구조화 데이터

MVP는 크롤러 없이 **수동 입력 데이터**만 사용한다.

### 최소 필수 컬럼 (MVP)

```sql
-- 전체 스키마는 spec-rag-policy-support.md 5.4 참조
-- MVP에서 반드시 채워야 하는 컬럼:
sido, sigungu, health_center_name,
contact_email, contact_phone,
ivf_fresh_limit, ivf_frozen_limit, iui_limit,
require_decision_notice, apply_before_treatment,
drug_external_covered,
required_documents,
budget_exhausted, budget_checked_at,
source_url, last_verified_at
```

### 데이터 품질 규칙

- `confidence < 0.7` → 결과 화면에 "정보 신뢰도 낮음, 보건소 직접 확인 필요" 배너 표시
- `last_verified_at` 7일 초과 → `budget` 항목 자동으로 `needs_check` 처리
- 해당 지역 row 없음 → `unknown` 카드 전용 화면, 보건소 직접 문의 유도

---

## P0-3: 결정론적 자격 체크 엔진

AI 없이 실행되는 8개 코드 체크. 상세 구현 로직은 [`spec-rag-policy-support.md`](./spec-rag-policy-support.md) 7장 참조.

### 체크 항목 요약

| ID | 항목 | 판단 로직 요약 |
|----|------|--------------|
| `check_region` | 거주지 | `sido` + `sigungu` 매칭 |
| `check_marriage` | 혼인 상태 | 법적 혼인 / 사실혼 구분 |
| `check_treatment` | 시술 유형 | policy limit 존재 여부 |
| `check_diagnosis` | 난임진단서 | `has_infertility_diagnosis` |
| `check_notice` | 지원결정통지서 | `require_decision_notice` × `has_decision_notice` × 시술일 비교 |
| `check_timing` | 신청 시점 | `apply_before_treatment` × D-day 계산 |
| `check_budget` | 예산 잔여 | `budget_exhausted` × `budget_checked_at` 경과일 |
| `check_attempt` | 지원 횟수 | `support_attempt_count` |

### 체크 결과 상태 타입

```ts
type EligibilityStatus =
  | 'confirmed'        // 조건 충족 확인됨
  | 'needs_check'      // 보건소 확인 필요
  | 'action_required'  // 시술 전 즉시 처리 필요
  | 'risk'             // 지원 불가 가능성
  | 'not_applicable'   // 해당 항목 없음
  | 'unknown';         // 데이터 없음

type CheckResult = {
  id: string;
  item: string;
  status: EligibilityStatus;
  note: string;
  days_until_treatment?: number;
};

type OverallStatus =
  | 'eligible_likely'    // 지원 가능성 높음
  | 'action_required'    // 즉시 확인 필요
  | 'uncertain'          // 불확실
  | 'likely_ineligible'; // 지원 어려울 가능성
```

### 종합 판단 집계 규칙

```
action_required 1개 이상 → overall: 'action_required'
risk 1개 이상 → overall: 'uncertain'
unknown 3개 이상 → overall: 'uncertain'
나머지 → overall: 'eligible_likely'
```

**중요:** 종합 판단도 "가능성 분류"다. "확정" 표현 사용 금지.

---

## P0-4: 가능성 카드 출력

### 카드 렌더링 우선순위

```
1. UrgentBanner         ← action_required 항목 있을 때만
2. EligibilityCard      ← 종합 판단 히어로
3. SupportItemsCard     ← policy_structured 데이터 있을 때
4. ChecklistCard        ← 항상
5. HealthCenterCard     ← contact_email 있을 때
6. MailDraftCard        ← inquiry_purposes 1개 이상
```

### 허용 표현 vs 금지 표현

| 상황 | 허용 | 금지 |
|------|------|------|
| 가능성 있음 | "지원 가능성이 있습니다" | "지원 대상입니다" |
| 확인 필요 | "보건소 확인이 필요합니다" | "무조건 신청 가능합니다" |
| 통지서 | "시술 전 통지서 발급 여부를 먼저 확인하세요" | "100% 받을 수 있습니다" |
| 최종 결과 | "최종 지원 여부는 보건소 확인으로 확정됩니다" | "이미 확정됩니다" |

---

## P0-5: 금지 표현 필터 (서버사이드)

LLM 응답은 반드시 이 필터를 통과한 후 클라이언트로 전달된다.

```ts
const FORBIDDEN_PHRASES = [
  '지원 대상입니다',
  '100% 받을 수 있',
  '무조건 신청 가능',
  '보건소에 확인하지 않아도',
  '반드시 지원됩니다',
  '확실히 받을 수',
  '당연히 됩니다',
  '문제없이 신청',
  '이미 확정',
] as const;

function assertSafeResponse(text: string): void {
  const violations = FORBIDDEN_PHRASES.filter((p) => text.includes(p));
  if (violations.length > 0) {
    throw new PolicySafetyViolationError(violations);
  }
}
```

위반 시: 응답 차단 → 안전 대체 문구 반환. 위반 로그를 서버 측에 기록한다.

---

## P1-1: 신청 체크리스트 자동 생성

자격 체크 결과에서 자동 도출. LLM 불필요.

### 자동 생성 규칙

| 체크 결과 | 생성 항목 |
|-----------|-----------|
| `check_diagnosis` → `action_required` | 난임진단서 발급 — 병원 요청 |
| `check_notice` → `action_required` | 지원결정통지서 신청 — e보건소 또는 보건소 방문 (deadline: 시술일 전일) |
| `check_budget` → `needs_check` | 예산 잔여 여부 확인 — 보건소 문의 |
| `check_timing` → `action_required` | 신청 마감 확인 — D-day 기한 표시 |
| `drug_external_occurred` → `null` | 원외약제비 처방전·영수증 보관 |
| 항상 포함 | 보건소 담당 부서 확인 |

### 체크리스트 항목 타입

```ts
type ChecklistItem = {
  id: string;
  label: string;
  sub: string;
  priority: 'urgent' | 'normal' | 'done';
  done: boolean;
  deadline?: string; // ISO date
};
```

---

## P1-2: 보건소 문의 초안 생성

### 포함 / 제외 원칙

**포함:**
- 거주 지역 (시군구 수준)
- 시술 유형 한국어 표현
- 시술 예정 시기 (월 단위)
- 문의 목적 목록
- 답변 이메일

**절대 제외:**
- 주민등록번호
- 실명 (성씨도 기본 제외)
- 배우자 개인정보
- 병원명 · 의사명
- 진단서 구체 내용 및 이미지
- 검사 수치
- 영수증 이미지

### 문의 목적 자동 생성 규칙

| 자격 체크 결과 | 자동 문의 목적 |
|--------------|--------------|
| `check_budget` → `needs_check` or `risk` | 예산 잔여 여부 확인 |
| `check_notice` → `action_required` | 지원결정통지서 발급 가능 여부 및 절차 |
| `check_timing` → `action_required` | 시술 전 신청 가능 기한 확인 |
| `drug_external_occurred` → `null` | 원외약제비 청구 가능 여부 |
| `required_documents` 불확실 | 필요 서류 목록 최신 확인 |
| `check_attempt` → `needs_check` | 잔여 지원 횟수 확인 |

### 면책 안내 (UI)

```
주민등록번호, 상세 진단명, 배우자 개인정보, 병원명,
검사 수치, 진단서·비용 증빙 이미지는 메일 초안에
포함되지 않았어요.
```

---

## P2-3: Fevio care loop 연결 (이후 릴리즈)

정책 결과를 단순 정보 페이지에 두는 것이 아니라 care loop에 연결한다.

### 변환 원칙

```
action_required 체크리스트 항목
    → CareActionCard (card_type: 'clinic_confirmation', assignee_role: 'primary_user')
    → 홈 화면 confirmed 카드로 노출

파트너에게는 sanitized 액션만 공유:
    "서류 준비 도움" / "보건소 동행" 등
    → raw 정책 텍스트·진단서 내용 제외
```

### 변환 조건

- 사용자가 체크리스트 항목을 "완료"로 표시해야 CareActionCard로 승격
- 자동 변환 금지 — 사용자 확인이 승격 트리거

---

## 개인정보 · 보안 경계

| 규칙 | 구현 위치 |
|------|-----------|
| 정책 검색은 서버에서만 수행 | API route — 클라이언트 직접 DB 접근 금지 |
| 사용자 의료·행정 데이터 RLS 적용 | couple-scoped, `user_id` 기준 |
| raw 정책 문서와 사용자 상황 분리 저장 | `policy_*` 테이블 ↔ `user_treatment_contexts` 분리 |
| 문의 초안에 민감정보 불포함 | LLM 프롬프트 제약 + 서버사이드 검증 |
| 보건소 답변 내용 사용자 수동 입력만 허용 | 자동 파싱·저장 금지 |

---

## MVP 범위

### 포함 (P0 + P1)

- 서울 25개 자치구 `policy_structured` 수동 입력
- 사용자 상황 입력 UI (`/policy-support?step=input`)
- 결정론적 자격 체크 8개 항목
- 가능성 카드 + 체크 항목 상태 배지
- 신청 체크리스트 (체크 인터랙션 포함)
- 보건소 연락처 카드
- 문의 메일 초안 (LLM)
- 금지 표현 필터 (서버사이드)
- 출처 URL + 마지막 확인일 표시
- 고정 면책 문구

### 제외 (P2 이후)

- RAG 벡터 검색 (pgvector)
- 자동 크롤러
- 서울 외 시도 정책 데이터
- care loop 연결 (CareActionCard 변환)
- 파트너 공유
- 메일 직접 발송
- 체크리스트 알림

---

## 수용 기준 (URL-action-result)

### AC-1: 핵심 플로우

```
/policy-support?step=input 에서 사용자가 서울 강남구 / 신선배아 / 2026-06-10 / 통지서 없음을 입력하고
"지원 가능성 확인하기"를 탭했을 때
"지원결정통지서 발급 여부와 예산 잔여 여부를 확인해야 함" (action_required + needs_check)
카드를 3초 안에 본다.
```

### AC-2: 금지 표현 방어

```
/policy-support?step=result 에서 사용자가 결과를 볼 때
"지원 대상입니다", "100% 받을 수 있습니다", "무조건 신청 가능합니다" 중
어떤 문구도 화면에 노출되지 않는다.
```

### AC-3: 체크리스트 생성

```
/policy-support?step=checklist 에서 사용자가 체크리스트를 볼 때
action_required 항목에 대응하는 항목이 "시술 전 확인" 그룹에 포함되어 있고
해당 항목에 deadline이 표시된다.
```

### AC-4: 문의 초안 — 민감정보 없음

```
/policy-support?step=contact 에서 사용자가 메일 초안을 볼 때
주민등록번호, 병원명, 진단서 내용, 검사 수치 중 어떤 것도
메일 본문에 포함되지 않는다.
```

### AC-5: 데이터 없는 지역

```
/policy-support?step=result 에서 해당 지역 policy_structured 데이터가 없을 때
"해당 지역 정보를 찾지 못했어요" 카드와 함께
관할 보건소 직접 문의 안내가 표시된다.
```

---

## 미결 사항

| # | 항목 | 결정 필요 | 기한 |
|---|------|-----------|------|
| 1 | 서울 25개 자치구 정책 데이터 | 수동 입력 담당자 지정 | MVP 전 |
| 2 | 이메일 발송 방식 | 직접 발송 API vs 클립보드 복사 | P1 완료 전 |
| 3 | 사실혼 사용자 플로우 | 별도 설계 필요 | P2 |
| 4 | 체크리스트 → CareActionCard 승격 UX | 사용자 확인 UI 설계 | P2 |
| 5 | 정책 데이터 신뢰도 검증 | 수동 검증 주기 및 담당자 | MVP 전 |
