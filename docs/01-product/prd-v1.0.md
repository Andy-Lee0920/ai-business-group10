# Fevio [페비오] — Product Requirements Document v1.0

> 병원에서 들은 내용을 그대로 캡처하면, 오늘 내가 할 일과 파트너가 도와줄 일이 나뉘고, 치료 맥락에 맞춰 홈 화면이 재구성되는 IVF Care Operation System

**Document type:** Implementation PRD
**Version:** 1.0 Final
**Status:** Engineering-ready after Grill Decision Review
**Primary market:** Korea
**Primary user:** IVF 1–2회차 맞벌이 여성
**Core product bet:** Dynamic Care Context Home + Partner Action Translation
**Core workflow:** Privacy Gate → Capture → Manual/LLM-assisted Action Split → Confirmation → Dynamic Home → Partner Action View
**Last decision pass:** Q1–Q20 complete

**Product origin:** `docs/01-product/original-note-hyunjoo.md` remains the highest-priority product origin. This PRD translates that origin into an implementation-ready v1.0 slice; it must not erase the original user pain around irregular schedules, medication/injection timing risk, couple information asymmetry, emotional load, and sensitive-data trust.

---

## 1. Executive Summary

Fevio [페비오] v1.0은 일반적인 난임 기록 앱, 복약 알림 앱, 캘린더 앱이 아니다.

이 제품의 핵심은 **병원 지시사항을 오늘 부부가 함께 실행할 수 있는 행동 카드로 번역하고, 오늘의 치료 맥락에 맞춰 홈 화면을 자동 재구성하는 것**이다.

v1.0에서 반드시 증명해야 하는 질문은 하나다.

> 병원에서 들은 말을 그대로 넣었을 때, 오늘 내가 할 일과 파트너가 도와줄 일이 명확히 나뉘고, 홈 화면만 보고 실행할 수 있는가?

v1.0은 5개 화면 모두를 P0로 구현한다. 단, 모든 화면은 full scope가 아니라 **thin vertical slice**로 구현한다.

1. Privacy & Clinical Boundary Gate
2. Post-Visit Capture
3. Action Split Review
4. Dynamic Care Context Home
5. Partner Action View

핵심 차별점은 입력 자동화가 아니라 **Care Context 기반 Dynamic Home**이다. Action Split은 Dynamic Home을 공급하는 핵심 엔진이며, Partner Action View는 부부 실행 구조를 완성하는 필수 화면이다.

---

## 2. Product Thesis

### 2.1 One-line Definition

Fevio [페비오]는 IVF 치료 중 병원 지시사항을 부부가 함께 실행 가능한 행동 카드로 변환하고, Care Day에 따라 홈 화면을 자동 재구성하는 **IVF Care Operation System**이다.

### 2.2 Core Insight

핵심 문제는 정보 부족이 아니다. 병원 지시사항은 존재한다.

진짜 문제는 **정보 번역 격차 + 운영 과부하**다.

병원에서 받은 정보를 다음 형태로 바꾸는 책임이 한 사람에게 집중된다.

- 오늘 몇 시에 무엇을 해야 하는가
- 어떤 항목은 병원에 다시 확인해야 하는가
- 파트너가 무엇을 도와야 하는가
- 어떤 행동은 완료되었는가
- 어떤 행동은 놓치면 안 되는가

### 2.3 Positioning

좋지 않은 포지셔닝:

> AI가 IVF 치료를 관리해주는 앱

권장 포지셔닝:

> 병원 지시사항을 부부가 실수 없이 함께 실행하도록 돕는 치료 운영 시스템

더 날카로운 포지셔닝:

> IVF 치료 과정에서 한 사람에게 몰린 기억·전달·확인 부담을 오늘의 부부 실행 카드로 나누는 앱

---

## 3. Primary User

### 3.1 Primary Persona

**김민지, 36세, 맞벌이 직장인, IVF 1–2회차**

김민지는 병원에서 초음파 결과, 다음 방문일, 주사 시간, 복약 일정, 파트너이 도와야 할 일을 한 번에 듣는다. 병원을 나와서는 그 내용을 기억하고, 정리하고, 파트너에게 설명하고, 오늘 할 일을 챙겨야 한다.

대표 감정:

> “나만 고생하는 것 같아서 억울하다.”

이 감정은 단순 불편이 아니다. 보이지 않는 치료 운영 노동이 한 사람에게 집중되어 있다는 신호다.

### 3.2 Primary Job-to-be-Done

> 병원에서 들은 복잡한 지시사항을, 오늘 내가 해야 할 일과 파트너가 도와줄 일로 빠르게 나누고 싶다. 그리고 오늘 홈 화면만 보고 놓치면 안 되는 일을 확인하고 싶다.

---

## 4. v1.0 Scope

### 4.1 P0 Scope

| Area | P0 Requirement |
|---|---|
| Auth | Google OAuth only |
| Privacy | 민감정보 수집·이용 동의, 파트너 공유 동의, 의료 조언 아님 고지 |
| Couple bootstrap | Google OAuth 직후 couple shell + primary/partner member 자동 생성 |
| Capture | 자연어 메모 입력, 붙여넣기, 음성 입력 진입점 |
| Action Split | Manual line split + 4-button classification |
| Confirmation | source text와 action card 확인 후 CareActionCard 생성 |
| Dynamic Home | onboarding/clinic/injection/waiting/routine care_day 지원 |
| Partner View | couple-level 7-day share link, "오늘 도와줄 일" 중심, 파트너 도움 완료 처리 가능, 3초 폴링 실시간 반영 |
| BYOK LLM | optional OpenRouter BYOK, settings only, Supabase Vault storage |
| Safety | LLM 의료 판단 금지, confirmation-first, display-only safety priority |
| Audit | confirmation, partner acknowledgement, card revision seen 기록 |

### 4.2 Out of Scope v1.0

| Excluded | Reason |
|---|---|
| 치료 전략 추천 | 의료 판단 리스크 |
| 용량 조정 추천 | 의료 판단 리스크 |
| 성공률 예측 | 신뢰·규제 리스크 |
| OCR 기반 처방전 자동 확정 | 정확도 및 안전성 검증 필요 |
| 배아 사진 업로드 | 민감정보·보관 정책 복잡도 |
| 병원 예약 직접 연동 | 병원별 시스템 상이 |
| 카카오 알림톡/SMS fallback | v1.1+ 신뢰성 레이어 |
| partner account onboarding | v1.1+ |
| rolling partner token rotation | v1.1+ |
| full calendar | v1.1+ |
| community/SNS | 초기 가치와 무관 |

---

## 5. Decision Stack Summary

| # | Area | Decision |
|---|---|---|
| Q1 | Action Split 기본 메커니즘 | Manual line split |
| Q2–3 | Auth provider | Google OAuth only |
| Q4 | Partner auth | 링크 기반 무계정 유지 |
| Q5 | LLM key location | Supabase Vault + Edge Function + manual fallback |
| Q6 | OpenRouter key entry | Settings hidden, post-first-split soft nudge |
| Q7 | Manual Split UX | 줄 단위 split + 4버튼 분류 |
| Q8 | SplitCandidate 저장 | Capture CTA → raw 저장, Confirm → batch 저장 |
| Q9 | LLM output contract | suggested_* only, assigned_to remains null |
| Q10 | safety_level | deterministic display priority + optional user marking |
| Q11 | Couple membership | couple_members 2-row primary + partner NULL |
| Q12 | OpenRouter key encryption | Supabase Vault + Edge Function decrypt/use |
| Q13 | Partner share TTL | Couple-level 7-day TTL + revocation |
| Q14 | Partner View data | Live view + changed badge, no snapshot |
| Q15 | Couple initialization | DB trigger + idempotency + bootstrap fallback |
| Q16 | First login Home | care_day = onboarding |
| Q17 | Waiting Day entry | Routine Home suggestion + explicit confirmation |
| Q18 | card_type | deterministic keyword inference + optional edit |
| Q19 | MVP cut | all 5 screens P0, thin vertical slice |
| Q20 | hasEverCaptured | couple_states.first_capture_completed_at |

---

## 6. Core Workflow

```text
Google OAuth
        ↓
Couple shell bootstrap
        ↓
Privacy & Clinical Boundary Gate
        ↓
Dynamic Home: onboarding state
        ↓
Post-Visit Capture
        ↓
Manual Line Split or optional LLM-assisted SplitCandidate draft
        ↓
Action Split Review: user assigns each candidate
        ↓
Confirm
        ↓
CareActionCards created
        ↓
Dynamic Care Context Home recomposed
        ↓
Partner share link generated
        ↓
Partner Action View: "오늘 도와줄 일" 중심 + 파트너 도움 완료 처리 + 3초 폴링 실시간 동기화
```

---

## 7. UX Requirements

### 7.1 Screen 1 — Privacy & Clinical Boundary Gate

**Purpose**
실제 IVF 정보가 민감정보임을 고지하고, 수집·공유·삭제·의료 경계 동의를 받는다.

**Required content**

- 민감정보 수집·이용 동의
- 파트너 공유 동의
- 보유·삭제 정책
- 의료 조언 아님 고지
- 외부 AI 전송 여부 고지
- 삭제 요청 방법

**Primary CTA**

> 동의하고 시작

**Blocking rule**

- Privacy Gate 완료 전에는 `visit_inputs`, `action_split_drafts`, `care_action_cards`, `partner_share_links`를 생성할 수 없다.

---

### 7.2 Screen 2 — Post-Visit Capture

**Purpose**
사용자가 병원에서 들은 내용을 정리하지 않고 그대로 캡처하게 한다.

**Required elements**

- Large natural input area
- Paste button
- Voice input entry point
- Optional hints: 약/주사, 시간, 다음 방문, 파트너 요청
- Microcopy: “잘 모르겠는 내용도 그대로 적어도 괜찮아요. 확인이 필요한 항목은 따로 표시됩니다.”

**Primary CTA**

> 실행 카드로 나누기

**Persistence rule**

- CTA 클릭 시점에 `visit_inputs.raw_text`와 `action_split_drafts` shell을 저장한다.
- 이 시점에는 `split_candidates`를 저장하지 않는다.

---

### 7.3 Screen 3 — Action Split Review

**Purpose**
앱이 나눈 줄/문장 후보를 사용자가 빠르게 역할별로 분류한다.

**Default mode: Manual Line Split**

```text
raw input
  ↓
line/sentence split
  ↓
SplitCandidate[] with assigned_to = null
  ↓
user classification
```

**Candidate classification buttons**

- 내 할 일
- 파트너에게 공유
- 병원에 확인
- 제외

**UX copy**

> 병원 메모에서 나눈 내용입니다. 각 항목을 어디에 둘지 선택해 주세요.

**Not allowed**

- 매 후보마다 강제 type selection
- LLM 결과를 바로 CareActionCard로 생성
- 분류 버튼 클릭마다 DB autosave

**Confirm CTA**

> 확정하기

**Confirm behavior**

- 최종 classified `split_candidates`를 batch 저장한다.
- excluded 항목은 CareActionCard를 만들지 않는다.
- non-excluded 항목은 `care_action_cards`로 변환한다.
- `couple_states.first_capture_completed_at`이 null이면 세팅한다.

---

### 7.4 Screen 4 — Dynamic Care Context Home

**Purpose**
confirmed card와 couple state를 기반으로 오늘의 치료 맥락에 맞는 홈 화면을 구성한다.

**P0 care_day states**

- onboarding
- clinic_day
- injection_day
- waiting_day
- routine_day

**Required behavior**

- 첫 로그인 후 capture 완료 전에는 onboarding home 표시
- injection card가 오늘 있으면 injection_day
- clinic_visit card가 오늘 있으면 clinic_day
- WaitingModeSuggestCard를 통해 waiting_day 수동 진입 가능
- 오늘 특별 카드가 없으면 routine_day
- confirmed card만 active execution surface에 노출

---

### 7.5 Screen 5 — Partner Action View

**Purpose**
파트너가 앱 설치 없이 오늘 자신이 도와야 할 일을 읽고 확인한다.

**Access model**

- Google login 없음
- couple-level 7-day signed share link
- server-side token validation
- read-only live partner action view

**Visible data**

- partner-visible current CareActionCards
- title
- scheduled_at
- action type
- changed/revoked/superseded state
- acknowledgement buttons

**Hidden data**

- raw visit input
- private notes
- emotion logs
- full treatment history
- non-partner-visible cards

**Partner actions**

- 확인했어요
- 민지에게 물어볼게요

---

## 8. Manual Action Split

### 8.1 Line Split Rules v1.0

```text
1. 줄바꿈 기준 분리
2. 마침표 / 물음표 / 느낌표 기준 보조 분리
3. 너무 짧은 조각은 이전 문장에 병합
4. 동일 문장 중복 제거
5. 빈 줄 제거
```

### 8.2 SplitCandidate Type

```ts
type AssignedTo =
  | "my_action"
  | "partner_action"
  | "clinic_confirmation"
  | "excluded";

type SplitCandidate = {
  id: string;
  source_text: string;
  suggested_title?: string;
  suggested_assigned_to?: AssignedTo | null;
  suggested_card_type?: CardType | null;
  assigned_to: AssignedTo | null;
  confidence: "high" | "needs_confirmation";
  uncertainty_reason?: string | null;
  order_index: number;
};
```

### 8.3 Storage Timing

**Commit point 1 — Capture CTA**

- save `visit_inputs`
- create `action_split_drafts`

**Client-only state**

- line split candidates
- per-candidate classification clicks

**Commit point 2 — Confirm CTA**

- batch insert `split_candidates`
- create `care_action_cards`
- update `couple_states.first_capture_completed_at` if null

```text
SplitCandidate rows are created only on final confirmation, not during per-candidate classification.
```

---

## 9. Optional LLM Flow: OpenRouter BYOK

### 9.1 Entry Point

OpenRouter key entry is not part of first-time onboarding.

Default first session:

```text
Google Login → Privacy Gate → Capture → Manual Action Split → Dynamic Home → Partner Share
```

After first manual split, show non-blocking nudge:

> 다음부터 자동 분류를 사용하고 싶다면 설정에서 OpenRouter 키를 연결할 수 있어요.

### 9.2 BYOK Storage

OpenRouter key storage uses **Supabase Vault**.

- no browser storage
- no plaintext application table storage
- app stores metadata only
- Edge Function decrypts and calls OpenRouter
- key is never returned to client
- key is never logged

### 9.3 user_ai_settings

```sql
CREATE TABLE user_ai_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openrouter'
    CHECK (provider IN ('openrouter')),
  vault_secret_id UUID NOT NULL,
  key_last4 TEXT NOT NULL,
  key_label TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invalid', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ
);
```

### 9.4 Edge Functions

#### `/functions/v1/openrouter-key`

Purpose: Store, verify, replace, or revoke user OpenRouter key.

Behavior:

- auth required
- validate session
- store API key in Supabase Vault
- upsert `user_ai_settings`
- return metadata only: `connected`, `key_last4`, `status`

#### `/functions/v1/action-split-llm`

Purpose: Generate LLM-assisted SplitCandidate draft.

Behavior:

- auth required
- read `user_ai_settings`
- decrypt key from Vault inside server path
- call OpenRouter
- require structured JSON output
- validate schema
- return `LLMSplitCandidateDraft[]`
- do not create CareActionCards

### 9.5 LLM Output Contract

```ts
type LLMSplitCandidateDraft = {
  source_text: string;
  suggested_title?: string;
  suggested_assigned_to?: AssignedTo | null;
  suggested_card_type?: CardType | null;
  confidence: "high" | "needs_confirmation";
  uncertainty_reason?: string | null;
};
```

Rules:

- LLM returns structured JSON only.
- LLM may suggest destination and card type.
- `assigned_to` remains null until user selection.
- LLM cannot create confirmed CareActionCards.
- LLM cannot assign `display_safety_level`.

---

## 10. Card Type and Safety Priority

### 10.1 CardType

```ts
type CardType =
  | "injection"
  | "medication"
  | "clinic_visit"
  | "clinic_confirmation"
  | "partner_support"
  | "record"
  | "general_action";
```

### 10.2 inferCardType()

`card_type` is inferred by deterministic keyword rules and optional user correction.

```ts
function inferCardType(
  text: string,
  assignedTo: AssignedTo,
  userSelectedCardType?: CardType | null,
  suggestedCardType?: CardType | null
): CardType {
  if (userSelectedCardType) return userSelectedCardType;
  if (assignedTo === "clinic_confirmation") return "clinic_confirmation";

  const normalized = text.toLowerCase();

  const priority: CardType[] = [
    "injection",
    "medication",
    "clinic_visit",
    "partner_support",
    "record",
    "clinic_confirmation"
  ];

  for (const type of priority) {
    const keywords = CARD_TYPE_KEYWORDS[type] ?? [];
    if (keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
      return type;
    }
  }

  if (suggestedCardType) return suggestedCardType;
  return "general_action";
}
```

### 10.3 Keyword Dictionary v1.0

```ts
const CARD_TYPE_KEYWORDS: Record<CardType, string[]> = {
  injection: [
    "주사", "주사약", "고날에프", "gonal", "퓨레곤", "puregon",
    "메노푸어", "menopur", "오비드렐", "ovidrel", "데카펩틸",
    "decapeptyl", "루프론", "lupron", "프롤루텍스", "트리거"
  ],
  medication: [
    "약", "복약", "복용", "먹는", "정", "캡슐", "mg", "질정",
    "프로게스테론", "에스트로겐", "유트로게스탄", "프로기노바",
    "프레마린", "엽산"
  ],
  clinic_visit: [
    "병원", "방문", "내원", "진료", "초음파", "피검", "피검사",
    "검사", "예약", "재방문", "채혈"
  ],
  clinic_confirmation: [
    "확인", "물어", "문의", "재문의", "여쭤", "다시 확인",
    "헷갈림", "모르겠"
  ],
  partner_support: [
    "파트너", "파트너", "같이", "함께", "도와", "준비", "확인해줘", "챙겨"
  ],
  record: ["기록", "메모", "컨디션", "체온", "증상", "통증", "느낌"],
  general_action: []
};
```

### 10.4 Display Safety Priority

`safety_level` is not persisted as medical judgment. It is computed as display-only priority.

```ts
type DisplaySafetyLevel = "normal" | "time_sensitive" | "critical";

function computeDisplaySafetyLevel(
  card: CareActionCard,
  now: Date
): DisplaySafetyLevel {
  if (card.status !== "confirmed") return "normal";

  if (card.user_marked_important) return "critical";

  if (card.card_type === "injection" && card.scheduled_at) {
    const minutesUntil = diffMinutes(new Date(card.scheduled_at), now);

    if (minutesUntil <= 30 && minutesUntil >= -30) return "critical";
    if (isToday(new Date(card.scheduled_at), now)) return "time_sensitive";
  }

  if (card.confirmation_required === true) return "time_sensitive";

  return "normal";
}
```

Rules:

- LLM cannot set criticality.
- User may optionally mark a card as important from card detail.
- Display safety priority is used only for UI ordering and emphasis.

---

## 11. Dynamic Care Context Home

### 11.1 CareDay Enum

```ts
type CareDay =
  | "onboarding"
  | "clinic_day"
  | "injection_day"
  | "waiting_day"
  | "routine_day";
```

### 11.2 hasEverCaptured

```text
hasEverCaptured = couple_states.first_capture_completed_at IS NOT NULL
```

### 11.3 Final computeCareDay()

```ts
export function computeCareDay(input: CareContextInput): CareDay {
  if (!input.hasEverCaptured) {
    return "onboarding";
  }

  if (input.manuallySelectedCareDay === "waiting_day") {
    return "waiting_day";
  }

  if (input.todayCards.some((card) => card.card_type === "injection")) {
    return "injection_day";
  }

  if (input.todayCards.some((card) => card.card_type === "clinic_visit")) {
    return "clinic_day";
  }

  return "routine_day";
}
```

Important:

- Criticality is not part of care_day decision.
- Criticality is handled by `computeDisplaySafetyLevel()`.
- `routine_day` is not the first-login state; `onboarding` is.

### 11.4 ComponentTree Contract

```ts
type ComponentTree = {
  schema_version: "care_home_component_tree.v1";
  role: "primary_user" | "partner";
  care_day: CareDay;
  generated_at: string;
  components: ComponentNode[];
};

type ComponentNode = {
  id: AllowedComponentId;
  priority: number;
  display_state: "visible" | "hidden" | "disabled";
  safety_class:
    | "operation"
    | "privacy"
    | "partner_coordination"
    | "emotional_support"
    | "record";
  props: Record<string, unknown>;
};
```

### 11.5 AllowedComponentId v1.0

```ts
type AllowedComponentId =
  | "PostVisitCaptureCard"
  | "PrivacyBoundaryReminderCard"
  | "GentleCheckInCard"
  | "TodayTop3ActionCard"
  | "ClinicVisitCard"
  | "InjectionTimeCard"
  | "PartnerAssistCard"
  | "PartnerConfirmationCard"
  | "WaitingModeSuggestCard"
  | "MinimalNextClinicCard"
  | "PartnerSupportPromptCard"
  | "RoutineNextStepCard"
  | "NoActionNeededCard";
```

Forbidden components:

- TreatmentRecommendationCard
- DoseAdjustmentCard
- DiagnosisPredictionCard
- EmbryoQualityJudgmentCard
- SuccessRatePredictionCard
- SymptomRiskAssessmentCard

### 11.6 Onboarding Home

Condition:

```text
hasEverCaptured = false
confirmedCards.length = 0
```

Main components:

1. PostVisitCaptureCard
2. PrivacyBoundaryReminderCard
3. GentleCheckInCard

### 11.7 Waiting Day Entry

Waiting Day is entered through soft suggestion and explicit user confirmation.

Suggestion condition:

```ts
function shouldSuggestWaitingDay(input: CareContextInput): boolean {
  return (
    input.hasEverCaptured === true &&
    input.todayCards.length === 0 &&
    input.manuallySelectedCareDay !== "waiting_day" &&
    hasRecentWaitingSignal(input) &&
    !isDismissedRecently(input.waiting_mode_dismissed_until)
  );
}
```

Waiting signal markers include:

- 결과 대기
- 피검
- 임신 테스트
- 배아 이식
- 이식 후
- 채취 결과
- 수정 결과
- 배양 결과
- 기다리

WaitingModeSuggestCard copy:

> 결과를 기다리는 중이신가요?
> 대기 모드로 전환하면 오늘 화면을 조금 더 조용하게 정리하고, 꼭 필요한 확인만 남겨둘 수 있어요.

Actions:

- 대기 모드로 전환
- 지금은 괜찮아요

---

## 12. Data Model

### 12.1 couples

```sql
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (created_by)
);
```

### 12.2 couple_members

```sql
CREATE TABLE couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('primary_user', 'partner')),
  display_name TEXT,
  invite_status TEXT NOT NULL DEFAULT 'placeholder'
    CHECK (invite_status IN ('placeholder', 'invited', 'linked', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_at TIMESTAMPTZ,
  UNIQUE (couple_id, role),
  UNIQUE (user_id)
);
```

### 12.3 couple_states

```sql
CREATE TABLE couple_states (
  couple_id UUID PRIMARY KEY REFERENCES couples(id) ON DELETE CASCADE,
  manually_selected_care_day TEXT CHECK (
    manually_selected_care_day IN (
      'waiting_day', 'routine_day', 'clinic_day', 'injection_day'
    )
  ),
  waiting_mode_started_at TIMESTAMPTZ,
  waiting_mode_confirmed_at TIMESTAMPTZ,
  waiting_mode_dismissed_until TIMESTAMPTZ,
  first_capture_completed_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.4 visit_inputs

```sql
CREATE TABLE visit_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  raw_text TEXT NOT NULL,
  capture_source TEXT NOT NULL CHECK (
    capture_source IN ('typed', 'pasted', 'voice_transcript', 'manual')
  ),
  status TEXT NOT NULL DEFAULT 'captured'
    CHECK (status IN ('captured', 'confirmed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.5 action_split_drafts

```sql
CREATE TABLE action_split_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_input_id UUID NOT NULL REFERENCES visit_inputs(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  mode TEXT NOT NULL CHECK (mode IN ('manual_line_split', 'llm_assisted')),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'confirmed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.6 split_candidates

```sql
CREATE TABLE split_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES action_split_drafts(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  suggested_title TEXT,
  suggested_assigned_to TEXT CHECK (
    suggested_assigned_to IN ('my_action', 'partner_action', 'clinic_confirmation', 'excluded')
  ),
  assigned_to TEXT NOT NULL CHECK (
    assigned_to IN ('my_action', 'partner_action', 'clinic_confirmation', 'excluded')
  ),
  suggested_card_type TEXT,
  card_type TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'needs_confirmation'
    CHECK (confidence IN ('high', 'needs_confirmation')),
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.7 care_action_cards

```sql
CREATE TABLE care_action_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  source_input_id UUID REFERENCES visit_inputs(id),
  split_candidate_id UUID REFERENCES split_candidates(id),
  assignee_role TEXT NOT NULL CHECK (assignee_role IN ('primary_user', 'partner', 'both')),
  card_type TEXT NOT NULL CHECK (
    card_type IN (
      'injection', 'medication', 'clinic_visit', 'clinic_confirmation',
      'partner_support', 'record', 'general_action'
    )
  ),
  title TEXT NOT NULL,
  description TEXT,
  source_text TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  care_date DATE,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'completed', 'dismissed', 'revoked', 'superseded', 'archived')),
  confirmation_required BOOLEAN NOT NULL DEFAULT TRUE,
  user_marked_important BOOLEAN NOT NULL DEFAULT FALSE,
  partner_visible BOOLEAN NOT NULL DEFAULT FALSE,
  medical_boundary_label TEXT NOT NULL DEFAULT 'user_confirmed_instruction',
  revision INT NOT NULL DEFAULT 1,
  superseded_by UUID REFERENCES care_action_cards(id),
  revoked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 12.8 partner_share_links

```sql
CREATE TABLE partner_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  partner_member_id UUID NOT NULL REFERENCES couple_members(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  accessed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Policy:

```text
expires_at = created_at + interval '7 days'
```

### 12.9 partner_share_events

```sql
CREATE TABLE partner_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES partner_share_links(id),
  couple_id UUID NOT NULL REFERENCES couples(id),
  partner_member_id UUID NOT NULL REFERENCES couple_members(id),
  card_id UUID REFERENCES care_action_cards(id),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('viewed', 'acknowledged', 'needs_clarification')
  ),
  card_revision_seen INT,
  card_updated_at_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Removed from v1.0:

```text
partner_share_snapshots
```

Partner View is live server-filtered view, not frozen snapshot.

---

## 13. Auth, Couple Bootstrap, and RLS

### 13.1 Auth

- Google OAuth only for v1.0.
- Partner access is link-based and unauthenticated.

### 13.2 Couple Initialization

A couple shell is created immediately after Google OAuth user creation.

```text
auth.users created
  ↓
couples row created
  ↓
couple_members primary_user row created
  ↓
couple_members partner placeholder row created
  ↓
couple_states row created
```

### 13.3 DB Trigger

```sql
CREATE OR REPLACE FUNCTION public.init_couple_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_couple_id UUID;
BEGIN
  INSERT INTO public.couples (created_by)
  VALUES (NEW.id)
  ON CONFLICT (created_by)
  DO UPDATE SET updated_at = now()
  RETURNING id INTO new_couple_id;

  INSERT INTO public.couple_members (
    couple_id, user_id, role, invite_status, linked_at
  )
  VALUES (new_couple_id, NEW.id, 'primary_user', 'linked', now())
  ON CONFLICT (couple_id, role)
  DO NOTHING;

  INSERT INTO public.couple_members (
    couple_id, user_id, role, invite_status
  )
  VALUES (new_couple_id, NULL, 'partner', 'placeholder')
  ON CONFLICT (couple_id, role)
  DO NOTHING;

  INSERT INTO public.couple_states (couple_id, updated_by)
  VALUES (new_couple_id, NEW.id)
  ON CONFLICT (couple_id)
  DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_init_couple
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.init_couple_for_new_user();
```

### 13.4 Bootstrap Fallback

`GET /api/bootstrap/me` must ensure idempotently:

- couple exists
- primary_user member exists
- partner placeholder exists
- couple_states row exists

### 13.5 RLS Requirements

- authenticated users can access only own couple data
- anon users cannot query care_action_cards or partner_action_views directly
- partner link access goes through server token validation only
- service role is allowed only in server/Edge-controlled paths

---

## 14. Partner Share Link and Partner View

### 14.1 Link Unit and TTL

Partner share link is **couple-level**, not card-level.

v1.0 policy:

- 7-day TTL
- explicit revocation
- one active link per couple/partner member
- no rolling token rotation in v1.0

### 14.2 Token Storage

- raw token is never stored
- store SHA-256 token_hash only
- no token in logs
- no partner direct DB access

### 14.3 Partner View Data Freshness

Partner Action View uses live server-filtered current data.

It does not use frozen snapshots.

Rules:

- always return current partner-visible cards
- compare each card against last partner acknowledgement
- if changed after acknowledgement: show `내용이 변경됨`
- if revoked: show `이 항목은 더 이상 유효하지 않아요`
- if superseded: show `새 항목으로 대체됨`

### 14.4 PartnerActionViewItem

```ts
type PartnerActionViewItem = {
  card_id: string;
  title: string;
  scheduled_at: string | null;
  action_type: CardType;
  display_state:
    | "current"
    | "new"
    | "changed_since_ack"
    | "revoked"
    | "superseded"
    | "completed";
  last_acknowledged_at?: string;
  current_revision: number;
  revision_seen?: number;
};
```

---

## 15. Indexing Requirements

Initial migration must include indexes.

```sql
CREATE INDEX idx_care_cards_couple_date_confirmed
ON care_action_cards (couple_id, care_date, scheduled_at)
WHERE status = 'confirmed';

CREATE INDEX idx_care_cards_couple_type_date
ON care_action_cards (couple_id, card_type, care_date)
WHERE status = 'confirmed';

CREATE INDEX idx_care_cards_partner_visible
ON care_action_cards (couple_id, assignee_role, care_date, scheduled_at)
WHERE partner_visible = true
  AND status IN ('confirmed', 'completed', 'revoked', 'superseded');

CREATE INDEX idx_care_cards_couple_status
ON care_action_cards (couple_id, status);

CREATE UNIQUE INDEX idx_partner_share_links_token_hash
ON partner_share_links (token_hash);

CREATE INDEX idx_partner_share_links_expires
ON partner_share_links (expires_at)
WHERE revoked_at IS NULL;
```

---

## 16. Safety and Medical Boundary

### 16.1 Product Boundary

Fevio [페비오] does not provide:

- diagnosis
- treatment recommendation
- dosage adjustment
- medication timing decision
- embryo quality judgment
- success prediction
- symptom risk assessment

### 16.2 Confirmation-first Rule

AI or app-generated content is draft or inferred presentation until user confirms.

User-confirmed action cards are still not medical advice. They are user-organized representations of clinic instructions.

### 16.3 Clinical Content Policy

The system may generate:

- logistical summaries
- user action candidates
- partner action candidates
- clinic confirmation prompts
- UI component trees from confirmed data

The system may not generate:

- “용량을 바꾸세요”
- “오늘 주사를 맞지 않아도 됩니다”
- “이 증상은 정상입니다”
- “성공 가능성이 높습니다”
- “병원에 가지 않아도 됩니다”

### 16.4 Clinic Guide AI Boundary

Clinic Guide AI is a user-input assistant for the post-clinic update flow. It may help the user map what they typed into existing product data, but it must not become a treatment planner or hidden writer.

Allowed Clinic Guide AI behavior:

- 약품명 문자열 → medications 테이블 행 정규화
- 다음 인터뷰 질문 제안
- 사용자 입력 보조 (자동완성 힌트)

Forbidden Clinic Guide AI behavior:

- 약 용량 추론 또는 확정
- 투약 시간 자동 결정
- 치료 단계 판단
- 의학적 조언 (“이 약을 맞아야 합니다” 류)
- 일정 자동 저장 (사용자 확인 없이)

Policy:

- `requiresUserConfirmation: true` is mandatory for AI-produced drafts.
- AI-produced drafts are saved only after 사용자 명시적 확인 후에만 저장한다.
- OpenRouter API 키는 클라이언트 번들에 절대 포함되지 않는다.
- OpenRouter API keys exist only as Supabase Edge Function 환경변수 or server-controlled secret storage and are never logged or returned to the client.

---

## 17. Engineering Implementation Issues

### Issue 1 — Auth + Privacy Gate + Couple Bootstrap

Scope:

- Google OAuth
- init_couple_for_new_user trigger
- bootstrap fallback
- Privacy & Clinical Boundary Gate
- couple_states creation

Acceptance:

- new user has couple_id, primary_member_id, partner_member_id before Capture
- sensitive data cannot be stored before Privacy Gate

### Issue 2 — Capture + Manual Line Split + Confirm

Scope:

- Post-Visit Capture
- `visit_inputs` save on Capture CTA
- `action_split_drafts` shell
- line split
- Manual Split Review
- 4-button classification
- Confirm transaction

Acceptance:

- raw input saved at Capture CTA
- split_candidates saved only at Confirm
- CareActionCards created after Confirm
- first_capture_completed_at set once

### Issue 3 — CareActionCard Model + card_type inference

Scope:

- care_action_cards schema
- inferCardType()
- computeDisplaySafetyLevel()
- revision / revoked / superseded model

Acceptance:

- no persisted LLM criticality
- card_type inferred without second required user input
- user can edit card_type from detail sheet

### Issue 4 — Dynamic Care Context Home / ComponentTree P0

Scope:

- CareDay enum including onboarding
- computeCareDay()
- ComponentTree contract
- HomeCompositionEngine
- AllowedComponentId registry
- WaitingModeSuggestCard

Acceptance:

- first login shows onboarding home
- confirmed injection card triggers injection_day
- confirmed clinic_visit triggers clinic_day
- Routine Day can suggest Waiting Day
- forbidden component cannot render

### Issue 5 — Partner Share Link + Partner Action View P0

Scope:

- partner_share_links
- partner_share_events
- 7-day link generation
- revoke
- expired page
- server-filtered live Partner View
- acknowledgement
- changed/revoked/superseded display states

Acceptance:

- partner needs no account
- partner cannot access DB directly
- token is hashed
- expired/revoked token cannot view data
- partner sees current partner-visible cards only

---

## 18. Test Requirements

### 18.1 Unit Tests

- line split rules
- inferCardType()
- computeDisplaySafetyLevel()
- computeCareDay()
- ComponentTree validation
- forbidden component registry tests

### 18.2 Integration Tests

- RLS couple isolation
- anon cannot read care_action_cards
- partner link API returns only sanitized view
- expired link returns expired state
- revoked link returns revoked state
- Confirm transaction creates split_candidates + care_action_cards + first_capture_completed_at

### 18.3 E2E Tests

- first login → onboarding home
- Privacy Gate → Capture → Split → Confirm → Dynamic Home
- Partner share link → Partner View → acknowledge
- expired/revoked partner link
- WaitingModeSuggestCard → waiting_day

### 18.4 Optional AI EVAL

If OpenRouter BYOK is enabled in staging/release:

- structured JSON schema compliance
- no medication hallucination
- no forbidden medical advice
- ambiguous items routed to uncertainty
- LLM does not assign final `assigned_to`
- LLM does not assign safety priority

---

## 19. Success Metrics

| Metric | v1.0 Target |
|---|---:|
| Capture completion rate | >80% |
| Manual Split completion rate | >70% |
| Confirmed card creation after Capture | >60% |
| Dynamic Home return after Confirm | >70% |
| Partner link open rate | >60% |
| Partner acknowledgement rate | >40% |
| Critical missed event | 0 reported cases |
| User-perceived burden reduction | qualitative positive |

Core qualitative question:

> 병원 다녀온 뒤 파트너에게 설명하는 부담이 줄었나요?

---

## 20. Final Product Statement

Fevio [페비오] v1.0은 IVF 치료 정보를 단순히 기록하는 앱이 아니다.

v1.0은 병원에서 들은 내용을 오늘의 부부 실행 카드로 바꾸고, 치료 맥락에 맞춰 홈 화면을 자동 재구성한다.

**The product is complete only when all five P0 screens are connected.**

```text
Privacy Gate
  → Capture
  → Action Split Review
  → Dynamic Care Context Home
  → Partner Action View
```
