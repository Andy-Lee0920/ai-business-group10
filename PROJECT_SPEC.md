# PROJECT_SPEC.md — Nudge Me (넛지미)

> **Generated**: 2026-04-09
> **Last Updated**: 2026-04-09
> **Status**: DRAFT (§0~§2 LOCKED, §3~§9 진행 중)
> **Owner**: ReliOptic 외 팀

본 문서는 [SpecDrivenDevelopment_Rule](docs/SpecDrivenDevelopment_Rule)에 따라 인터뷰 기반으로 작성되었습니다. 코드 생성 전 본 문서를 항상 참조하며, 본 문서와 충돌하는 코드 요청은 반드시 사전 확인을 거칩니다.

---

## 0. Project Identity ✅ LOCKED

| Field | Value |
|---|---|
| **Project Name** | Nudge Me (넛지미) |
| **One-line Purpose** | 당신이 원하는 사람이 되도록, 슬쩍 밀어드립니다 — 환경 설계 기반 행동 교정 시스템 |
| **Target Users** | 토스 앱 사용자 (B2C, MAU 2,480만 잠재 풀, 전 연령) |
| **Deployment Target** | App in Toss (미니앱, WebView 기반, 번들 ≤50MB) |
| **MVP Deadline** | 없음 (단, 목업 금지 — 프로덕션급 클린 버전 요구) |
| **이론적 근거** | Nudge Theory (Thaler & Sunstein), BJ Fogg Behavior Model |

### 0.1 핵심 제품 철학 ⚠️ 중요 결정

**Nudge vs Force 갈등 → 옵션 B (하이브리드) 채택**

- **기본 모드**: 순수 넛지. 비난·강요 없음. RULE_01~05 (SDD_Whytree_NudgeMe) 엄격 준수
- **사용자 선택형 `forceMode` 토글**: 사용자가 자발적으로 켤 경우 마일드 페널티 활성화 (예: 캐릭터 시들음, 셀프-약속 공개)
- **🔴 절대 금지**: 금전 페널티, 실손 페널티 (토스 미니앱 사행성 규제 리스크)

> 🧠 **철학적 근거**: "강제조차 사용자가 선택하게 만든다" — Nudge Theory의 '선택 환경 설계' 원칙을 더 깊이 구현. 팀원의 강제성 요구도 충족.

### 0.2 모듈 스코프 (전체 4개 모듈 모두 MVP 포함)

| ID | Name | Solves |
|---|---|---|
| **M-001** | Pattern Tracker | P-001 패턴 인식 불가 |
| **M-002** | Nudge Trigger | P-002 교정 타이밍 부재 |
| **M-003** | Replacement Behavior Engine | P-003 대안 행동 부재 |
| **M-004** | Correction Streak | P-004 지속성 부재 |

---

## 1. Tech Stack Boundaries ✅ LOCKED

### 1.1 Runtime & Language

| Layer | Technology | Version | Strict |
|---|---|---|---|
| Language | **TypeScript** | 5.x | ✅ Yes |
| Runtime | Node | 20.x LTS | |
| Pkg Mgr | npm | 10.x | |

### 1.2 Framework & Libraries

| Category | Choice | Notes |
|---|---|---|
| Framework | **React** 19 + **Vite** 8 | 기존 유지 |
| Routing | **React Router** v7 | 4모듈 분리 |
| Styling | **Tailwind v4** + CSS variables (design tokens) | Liquid Glass 디자인 시스템 |
| Client State | **Zustand** | 가벼움 (번들 ≤50MB 제약) |
| Server/Async State | **TanStack Query** | (Local-first에선 Dexie 쿼리 래핑용) |
| Persistence | **Dexie (IndexedDB)** | Local-first 핵심 |
| Validation | **Zod** | 클라/스키마 양쪽 |
| Testing | **Vitest** + **Playwright** (E2E) | |
| Linting | ESLint + Prettier | 기존 유지 |

### 1.3 Forbidden Patterns

- ❌ `any` 타입 사용 금지 (불가피 시 `// @ts-expect-error` + 사유 주석)
- ❌ Default exports 금지 (named export only)
- ❌ Inline styles 금지 (Tailwind 또는 디자인 토큰 사용)
- ❌ `document.querySelector` 등 React 외부에서 DOM 직접 조작 금지 — `useRef` 사용
- ❌ `alert()`, `confirm()` 사용 금지 — Toast/Modal 컴포넌트 사용
- ❌ 하드코딩된 색상/여백 금지 — 디자인 토큰 참조
- ❌ 금전·실손 페널티 로직 금지 (영구)

### 1.4 디자인 시스템

[`docs/SDD_Design.md`](docs/SDD_Design.md) — **Amorphous Liquid Glass System** 준수.
- Refraction Index: n = 1.05 ~ 1.15
- Corner Radius: Continuous Squircle, ≥28pt
- Spring Animation: Damping 0.8, Response 0.4
- 정적/동적 렌더링 분기 (배터리 최적화)

---

## 2. Data Schema & API Contract ✅ LOCKED (v1.2 — 2026-04-09)

> **v1.1**: `BadPattern.forceModeOverride`, `User.settings`, `directionalScore` 공식
> **v1.2**: `NudgeReaction`에 `'expired'` 추가, `NudgeRule`에 `origin`/`confidence` 추가 (시스템 학습 vs 사용자 수동), 타임아웃 기반 IGNORED 제거 → 세션 기반 EXPIRED

### 2.1 아키텍처 결정: **Local-first + Toss SDK 적극 통합**

```
┌──────────────────────────────────────┐
│  Nudge Me Mini App (WebView)         │
│  ┌──────────────────────────────┐    │
│  │ React UI Layer               │    │
│  ├──────────────────────────────┤    │
│  │ Zustand (UI state)           │    │
│  │ TanStack Query (data layer)  │    │
│  ├──────────────────────────────┤    │
│  │ Dexie (IndexedDB)  ◄── 단일 진실의 원천 │
│  └──────────────────────────────┘    │
│         ▲                            │
│         │ phase 2: 양방향 동기화        │
│         ▼                            │
│  ┌──────────────────────────────┐    │
│  │ Toss SDK Adapter Layer       │    │
│  │ - 토스 로그인 (사용자 식별)        │    │
│  │ - 푸시 알림 (Nudge 발화)         │    │
│  │ - 위치/시간 컨텍스트              │    │
│  │ - 토스 포인트 (positive 보상만)    │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**전략**: phase 1은 Local-first (Dexie 단독)로 즉시 작동. 모든 데이터 접근은 **Repository 인터페이스** 뒤에 추상화하여, phase 2에 클라우드 동기화 백엔드를 붙여도 UI/Service 코드 변경 0.

### 2.2 Entity Schema (Dexie / TypeScript)

```typescript
// src/db/schema.ts

// ============ User ============
interface User {
  id: string;                    // uuid v4
  nickname: string;              // 토스 SDK 연동 시 동기화
  tossUserId?: string;           // phase 2: 토스 식별자
  forceMode: boolean;            // 0.1 핵심 토글 — 글로벌 디폴트, default: false
  settings: Record<string, unknown>; // 확장 예약 (알림 시간대, 테마, 언어, 배터리 모드 등) — UserPreferences 분리는 §3에서 재검토
  createdAt: number;             // epoch ms
  updatedAt: number;
}

// ============ M-001: Pattern Tracker ============
interface BadPattern {
  id: string;
  userId: string;                // FK → User
  label: string;                 // "오후 3시 군것질"
  description?: string;
  category: PatternCategory;     // 'eating' | 'screen' | 'sleep' | 'spending' | 'custom'
  severity: 1 | 2 | 3 | 4 | 5;   // 사용자가 인지하는 심각도
  forceModeOverride: boolean | null; // null = User.forceMode 따름. true/false = 패턴별 오버라이드. "군것질엔 세게, 수면은 살살"
  isActive: boolean;             // soft delete
  createdAt: number;
  updatedAt: number;
}

interface PatternEvent {
  id: string;
  userId: string;
  patternId: string;             // FK → BadPattern
  occurredAt: number;            // epoch ms — 시계열 분석 핵심
  source: EventSource;           // 'self_report' | 'nudge_reaction' | 'auto_detect'
  context?: {
    timeOfDay: number;           // 0-23
    dayOfWeek: number;           // 0-6
    location?: { lat: number; lng: number };
    weather?: string;            // phase 2: 외부 API
  };
  note?: string;                 // 사용자 메모
}

type PatternCategory = 'eating' | 'screen' | 'sleep' | 'spending' | 'custom';
type EventSource = 'self_report' | 'nudge_reaction' | 'auto_detect';

// ============ M-002: Nudge Trigger ============
interface NudgeRule {
  id: string;
  userId: string;
  patternId: string;             // FK → BadPattern
  origin: RuleOrigin;            // v1.2: 'system_learned' | 'user_created' — 2-tier (Implicit Intelligence + Explicit Override)
  confidence: number;            // v1.2: 0-1, system_learned 룰의 학습 신뢰도. user_created는 항상 1.0
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;  // discriminated union (아래)
  messageTemplate: string;       // "{patternLabel} 시간이에요. {alternative} 어때요?"
  toneVariant: ToneVariant;      // 'soft' | 'force' (forceMode 해석 결과)
  isEnabled: boolean;
  lastEvaluatedAt?: number;      // insights.service의 마지막 학습 시각
  createdAt: number;
}

type RuleOrigin = 'system_learned' | 'user_created';

type TriggerType = 'time' | 'frequency' | 'location' | 'context';

type TriggerConfig =
  | { type: 'time'; hour: number; minute: number; daysOfWeek: number[] }
  | { type: 'frequency'; eventCount: number; windowMinutes: number }
  | { type: 'location'; lat: number; lng: number; radiusMeters: number }
  | { type: 'context'; conditions: Record<string, unknown> }; // 날씨/캘린더 등

type ToneVariant = 'soft' | 'force';

interface NudgeDelivery {
  id: string;
  userId: string;
  ruleId: string;                // FK → NudgeRule
  deliveredAt: number;
  reaction: NudgeReaction;       // default 'pending'
  reactedAt?: number;
}

type NudgeReaction = 'pending' | 'accepted' | 'snoozed' | 'ignored' | 'dismissed' | 'expired';
// v1.2: 'expired' 추가 — 세션 기반(자정 또는 같은 룰 재발화 시) 자동 만료. 'ignored'와 구분: 'ignored'는 사용자가 봤지만 무반응, 'expired'는 사용자가 보지도 못함

// ============ M-003: Replacement Behavior ============
interface ReplacementAction {
  id: string;
  userId: string;
  patternId: string;             // FK → BadPattern
  level: 1 | 2 | 3;              // Lv1: 30초 / Lv2: 5분 / Lv3: 더 본격
  label: string;                 // "물 한 잔 마시기"
  estimatedSeconds: number;
  satisfiesNeed: string;         // "스트레스 해소" — BadPattern과 같은 욕구
  createdAt: number;
}

interface CorrectionLog {
  id: string;
  userId: string;
  patternId: string;
  replacementActionId?: string;  // null이면 실패 = 데이터
  outcome: CorrectionOutcome;
  loggedAt: number;
  triggeredByNudgeId?: string;   // FK → NudgeDelivery (있으면 넛지 → 교정 흐름 추적)
}

type CorrectionOutcome = 'completed' | 'partial' | 'failed' | 'skipped';

// ============ M-004: Correction Streak ============
interface Streak {
  id: string;
  userId: string;
  patternId: string;             // 패턴별 스트릭
  currentDays: number;           // 연속 일수 (a 기반)
  longestDays: number;
  directionalScore: number | null; // 0-100, 지난 7일 vs 이전 7일 개선율. 등록 14일 미만이면 null = "데이터 수집 중"
  lastCorrectionAt: number;
  forgivenessUsed: number;       // 이번 주 사용한 forgiveness 횟수
  updatedAt: number;
}

/**
 * directionalScore 계산 공식 (§4 상태머신에서 상태 전이로 상세 정의)
 *
 *   patternAgeDays = (now - BadPattern.createdAt) / 86400000
 *   if (patternAgeDays < 14) → null  // 데이터 수집 중
 *
 *   prev7Count = count(PatternEvent where -14d ≤ occurredAt < -7d)
 *   curr7Count = count(PatternEvent where -7d ≤ occurredAt < now)
 *   reductionRate = (prev7Count - curr7Count) / max(prev7Count, 1)
 *   directionalScore = clamp(50 + reductionRate * 50, 0, 100)
 *
 *   해석: 50 = 변화 없음, 100 = 완전 개선, 0 = 악화 2배 이상
 *   max(prev7Count, 1)로 division by zero 방지
 */
```

### 2.3 Dexie 인덱스 정의

```typescript
// src/db/database.ts
import Dexie, { type Table } from 'dexie';

export class NudgeMeDB extends Dexie {
  users!: Table<User, string>;
  badPatterns!: Table<BadPattern, string>;
  patternEvents!: Table<PatternEvent, string>;
  nudgeRules!: Table<NudgeRule, string>;
  nudgeDeliveries!: Table<NudgeDelivery, string>;
  replacementActions!: Table<ReplacementAction, string>;
  correctionLogs!: Table<CorrectionLog, string>;
  streaks!: Table<Streak, string>;

  constructor() {
    super('NudgeMeDB');
    this.version(1).stores({
      users: 'id, tossUserId, updatedAt',
      badPatterns: 'id, userId, isActive, [userId+isActive]',
      patternEvents: 'id, userId, patternId, occurredAt, [userId+occurredAt], [patternId+occurredAt]',
      nudgeRules: 'id, userId, patternId, isEnabled, [userId+isEnabled]',
      nudgeDeliveries: 'id, userId, ruleId, deliveredAt, reaction',
      replacementActions: 'id, userId, patternId, [patternId+level]',
      correctionLogs: 'id, userId, patternId, loggedAt, [patternId+loggedAt]',
      streaks: 'id, userId, patternId, [userId+patternId]',
    });
  }
}
```

### 2.4 Repository 인터페이스 (백엔드 추상화)

phase 2 클라우드 동기화 전환 시 어댑터만 교체. UI/Service 변경 0.

```typescript
// src/repositories/types.ts
export interface PatternRepository {
  list(userId: string): Promise<BadPattern[]>;
  get(id: string): Promise<BadPattern | null>;
  create(input: Omit<BadPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<BadPattern>;
  update(id: string, patch: Partial<BadPattern>): Promise<BadPattern>;
  softDelete(id: string): Promise<void>;
}

export interface PatternEventRepository {
  log(input: Omit<PatternEvent, 'id'>): Promise<PatternEvent>;
  listByPattern(patternId: string, range: { from: number; to: number }): Promise<PatternEvent[]>;
  countByHour(userId: string, days: number): Promise<Record<number, number>>;
}

// ... NudgeRuleRepository, NudgeDeliveryRepository, ReplacementRepository,
//     CorrectionLogRepository, StreakRepository (동일 패턴)
```

**Service 레이어**는 **Repository 인터페이스에만** 의존. 구현체는 phase 1 = `DexiePatternRepository`, phase 2 = `RemoteSyncedPatternRepository` (Dexie + REST).

### 2.5 "API 계약" — Local-first 환경의 의미

백엔드 API가 없으므로 **Service 메서드 시그니처가 곧 API 계약**입니다. 모든 Service 메서드는 다음 명세를 따릅니다:

```typescript
// 예시: src/services/pattern.service.ts
interface PatternService {
  /**
   * 새 BadPattern 등록
   *
   * @throws ValidationError - label 비어있거나 50자 초과
   * @throws DuplicatePatternError - 같은 userId+label 이미 존재
   */
  createPattern(input: CreatePatternInput): Promise<Result<BadPattern, PatternError>>;

  /**
   * 시계열 인사이트 — "당신은 오후 3시에 가장 자주 무너집니다"
   *
   * @returns timeOfDayHistogram + topRiskHour + weeklyTrend
   * @throws NotFoundError - patternId 존재하지 않음
   */
  getInsights(patternId: string, days: number): Promise<Result<PatternInsights, PatternError>>;
}
```

**모든 Service 메서드는 `Result<T, E>` 패턴을 반환** (예외 throw 금지, 단 ValidationError는 예외 가능). §6 에러 핸들링에서 상세 정의.

### 2.6 검증된 답변 반영

| 질문 | 답변 | 반영 |
|---|---|---|
| 1. 패턴 입력 방식 | A + B(토스 SDK 자동 감지) 적극 | `EventSource = 'self_report' \| 'nudge_reaction' \| 'auto_detect'`, Toss SDK Adapter Layer 명시 |
| 2. PatternEvent 입력 | C (셀프 + 넛지반응) | `source` 필드 두 값 모두 지원 |
| 3. 트리거 종류 | 4종 모두 | `TriggerType` discriminated union 4종 |
| 4. Streak 정의 | a(연속일수) 기반 + c(방향성) 추구 | `currentDays` + `directionalScore` 둘 다 |
| 5. 백엔드 | A (Local-first) | Dexie + Repository 추상화 |

---

## 3. Architecture & Design Patterns ✅ LOCKED

### 3.1 레이어 (4단)

```
UI (routes/, components/)
   ↓ uses
Hooks (use-*.ts) — TanStack Query 래핑, Zustand 셀렉터
   ↓ calls
Services (*.service.ts, Result<T,E> 반환)
   ↓ depends on
Repositories (인터페이스)        Toss Adapters (capability별 인터페이스)
   ↓ implemented by                  ↓ implemented by
DexieXxxRepository (phase 1)     Mock*Adapter (phase 1) / Real*Adapter (phase 2)
```

**철칙**:
- 🔴 Components는 Service/Repository 직접 호출 금지 → 반드시 Hook 경유
- 🔴 Services는 Repository **인터페이스**에만 의존 (구현체 import 금지)
- 🔴 Components 비즈니스 로직 금지
- 🔴 Dexie import는 `src/db/`, `src/repositories/dexie/` 안에서만

### 3.2 빌드 모드: Vite SPA + React Router v7 (라이브러리 모드)

토스 미니앱 WebView 최적화. SSR 없음, 단일 번들, 코드 스플리팅은 route-level lazy import.

### 3.3 Toss Adapter — Capability별 인터페이스 분리

`adapters/toss/types.ts`:

```typescript
// 거대 단일 인터페이스 금지 — capability별 쪼개서 phase 2에 점진 도입
export interface TossAuthAdapter {
  login(): Promise<Result<TossUser, TossError>>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<TossUser | null>;
}

export interface TossPushAdapter {
  requestPermission(): Promise<boolean>;
  schedule(notification: NudgeNotification): Promise<Result<string, TossError>>; // returns notification id
  cancel(notificationId: string): Promise<void>;
}

export interface TossContextAdapter {
  getLocation(): Promise<GeoCoord | null>;
  getTimeContext(): Promise<TimeContext>;
}

export interface TossClipboardAdapter {
  read(): Promise<string | null>;
  write(text: string): Promise<void>;
}

// phase 1: 모두 Mock 구현체. phase 2: 필요한 것부터 Real로 교체.
```

mock 구현체는 `adapters/toss/mock/` 디렉토리, real은 `adapters/toss/real/` (phase 2). DI는 `adapters/toss/index.ts`에서 환경변수로 주입.

### 3.4 디렉토리 구조

(상기 §3 인터뷰 초안의 트리 구조 그대로 채택. `adapters/toss/` 만 capability별 파일로 분리)

```
src/adapters/toss/
├── types.ts                    # TossAuthAdapter, TossPushAdapter, TossContextAdapter, TossClipboardAdapter
├── mock/
│   ├── auth.mock.ts
│   ├── push.mock.ts
│   ├── context.mock.ts
│   └── clipboard.mock.ts
├── real/                       # phase 2
│   └── (점진 추가)
└── index.ts                    # capability별 DI
```

### 3.5 파일 네이밍 컨벤션

| 종류 | 컨벤션 | 예시 |
|---|---|---|
| Components | `PascalCase.tsx` | `PatternCard.tsx` |
| Hooks | `use-kebab-case.ts` | `use-patterns.ts` |
| Services | `kebab-case.service.ts` | `pattern.service.ts` |
| Repositories | `kebab-case.repo.ts` | `pattern.repo.ts` |
| Adapters | `kebab-case.{mock\|real}.ts` | `auth.mock.ts` |
| Stores | `kebab-case.store.ts` | `ui.store.ts` |
| Types | `kebab-case.types.ts` | `common.types.ts` |
| Routes | RR v7 컨벤션 | `$patternId.tsx` |

### 3.6 InferenceEngine 레이어 (v1.1 추가)

§4 Tier 1 시스템 학습은 별도 레이어로 분리. Service는 인터페이스에만 의존, phase 2에 서버사이드 LLM 엔진으로 교체 가능.

```
Services
   ↓
InferenceEngine (인터페이스)
   ↓
LocalStatEngine (phase 1) — 순수 TS, 알고리즘 3개 단일 파일
RemoteEngine (phase 2)    — 서버 API
```

```
src/inference/
├── types.ts                # InferenceEngine 인터페이스
├── local-stat.engine.ts    # phase 1 — 알고리즘 3개 한 파일에 (peakHours, riskDays, directionalScore)
└── index.ts                # DI
```

**phase 1 알고리즘 3개만**:
1. **피크 시간대 히스토그램** → `peakRiskHours` 상위 2개
2. **요일 빈도** → `riskDaysOfWeek` (평균 이상)
3. **directionalScore** → §2 v1.1 공식 (지난 7일 vs 이전 7일)

response-classifier, trend-analyzer 등은 **phase 2 서버사이드로 이관**. `algorithms/` 하위 폴더 생성 금지.

### 3.7 Nudge Template Pool (데이터, 알고리즘 아님)

`src/data/nudge-templates.ts` — 메시지 다양성을 위한 컨디션 매칭 풀. 번들 사이즈 무시 가능.

```typescript
const SOFT_TEMPLATES = [
  { condition: 'timeOfDay >= 14 && timeOfDay <= 16', text: '오후 슬럼프 시간이네요. {alternative}로 환기해봐요' },
  { condition: 'currentDays >= 7', text: '{currentDays}일째 잘하고 있어요. 오늘도 {alternative} 어때요?' },
  { condition: 'currentDays === 0', text: '다시 시작하는 것도 대단해요. {alternative} 같이 해봐요' },
  { condition: 'directionalScore >= 70', text: '요즘 확실히 줄고 있어요! 이 흐름 이어가볼까요?' },
  { condition: 'default', text: '잠깐, {alternative} 먼저 해보는 건 어때요?' },
  { condition: 'default', text: '지금 {patternLabel} 대신 {alternative}? 30초면 돼요' },
  // ... 충분히 많이
];
const FORCE_TEMPLATES = [ /* forceMode용 마일드 강도 버전 */ ];
```

`nudge.service.ts`가 발화 시점에 currentDays/directionalScore/timeOfDay 컨텍스트로 매칭, 같은 조건 중 random pick → 매번 다른 메시지 → "나를 보고 있구나" 감각.

### 3.8 연산 타이밍 & 캐싱 정책 (WebView 메인 스레드 보호)

🔴 **InferenceEngine 호출 규칙**:
- ❌ 앱 최초 진입 시 호출 금지 (로딩 지연)
- ✅ `requestIdleCallback` 또는 `setTimeout(..., 3000)` idle 시점에만
- ✅ 결과는 `User.settings.profile.inferred`에 캐싱
- ✅ 갱신 주기: 1일 1회 OR PatternEvent 5건 신규 누적 시
- ❌ 매 평가마다 재계산 금지

🔴 **백그라운드 연산 금지** — 토스 미니앱 비활성 시 WebView suspend됨. 미래 시점 알림은 `TossPushAdapter.schedule()`에 위임. 앱 내 setInterval은 활성 시에만.

### 3.9 번들 사이즈 버짓 (gzip)

| 항목 | 예상 |
|---|---|
| React 19 + DOM | ~45KB |
| React Router v7 | ~15KB |
| Zustand | ~2KB |
| TanStack Query | ~13KB |
| Dexie | ~25KB |
| Zod | ~13KB |
| Tailwind (purged) | ~10KB |
| 우리 앱 코드 | ~100KB |
| **합계** | **~220KB** |

토스 50MB 제한 대비 여유 충분. **TensorFlow.js, ML 라이브러리, 무거운 차트 라이브러리 일체 금지**.

### 3.10 UserPreferences 분리 결정

별도 테이블로 분리하지 않음. `User.settings: Record<string, unknown>` + Zod 스키마로 타입 안전. 필드 10개 초과 시 Dexie version 2 마이그레이션.

```typescript
// src/lib/user-settings.ts
export const UserSettingsSchema = z.object({
  notificationHours: z.array(z.number().int().min(0).max(23)).default([9, 13, 18]),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.enum(['ko', 'en']).default('ko'),
  batterySaverMode: z.boolean().default(false),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;
```

---

## 4. State Machine & Flow Control ✅ LOCKED

### 4.1 핵심 설계 원칙 (UX 결정 사항)

타겟 사용자는 **30대 직장인** — 토스 인앱 스크린타임이 짧고 산발적. 따라서:

- ❌ **시간 기반 IGNORED 타임아웃 금지** — 사용자의 짧은 세션을 존중
- ❌ **사용자가 직접 만드는 IFTTT 룰 금지** — 2026년 UX는 에이전틱
- ✅ **시스템이 학습**, 사용자는 피드백만
- ✅ **앱 미접속은 페널티 아님** — 미접속에 페널티 = 사실상 force, 넛지 철학 위배

### 4.2 NudgeDelivery 상태 머신 (세션 기반)

```
   ┌─────────┐
   │ PENDING │  ← Scheduler가 트리거 매치 시 생성
   └────┬────┘
        │ 즉시 (앱 활성 시) 또는 Toss Push 발화 시
        ▼
   ┌──────────┐
   │DELIVERED │  ← 사용자에게 노출, 시간 만료 없음
   └────┬─────┘
        │
   ┌────┼────┬────────┬─────────┬─────────┐
   ▼    ▼    ▼        ▼         ▼         ▼
ACCEPTED SNOOZED IGNORED DISMISSED EXPIRED (자동)
```

**전이 규칙**:
| 전이 | 조건 | 부수효과 |
|---|---|---|
| `PENDING → DELIVERED` | 트리거 매치 + 사용자에 노출 | — |
| `DELIVERED → ACCEPTED` | 사용자가 ReplacementAction 선택 | CorrectionLog 생성 (`outcome=completed`, `triggeredByNudgeId` 채움), Streak 재계산 |
| `DELIVERED → SNOOZED` | 사용자가 "나중에" 선택 | 같은 룰의 다음 발화 시점에 다시 DELIVERED |
| `DELIVERED → IGNORED` | 사용자가 봤으나 반응 없이 화면 닫음 | PatternEvent 자동 기록 (`source=nudge_reaction`) |
| `DELIVERED → DISMISSED` | 사용자가 명시적 X | 기록 없음 |
| `* → EXPIRED` | (a) 같은 룰의 새 NudgeDelivery 생성 시 이전 미반응 / (b) 자정 일괄 정리 | 기록만 — 페널티 없음 |

**핵심**: `EXPIRED`는 시스템이 데이터를 정리하기 위한 상태일 뿐, 사용자에게 부정적 의미 없음. UI는 "놓친 넛지 1건"으로 표시하되 비난 금지.

### 4.3 Streak 상태 머신 + Forgiveness 재정의

```
COLLECTING (≤14일) → ACTIVE → (FORGIVEN ⇄ ACTIVE) → RESETTING → ACTIVE
```

**Forgiveness 룰** (v1.2 재정의):

| 상황 | 처리 | 카운트 소모 |
|---|---|---|
| 앱 **미접속** 일 | 자동 면제 (`auto_forgiven`) | ❌ 소모 안 함 |
| 앱 접속 + 교정 **의도적 실패** | 사용자 forgiveness | ✅ 주 2회 한도 내 소모 |
| 한도 초과 | RESETTING (currentDays=0, longestDays 보존) | — |

**판정**: "앱 접속 여부"는 `session.store`의 마지막 활성 timestamp로 판단. 자정 cron(또는 다음 앱 진입 시 lazy 평가)에서 전일 접속 여부 확인.

- 메시지: "방향이 잠시 흔들렸어요. 다시 시작합니다" (비난 없음)
- forgivenessUsed는 매주 월 00:00 리셋

### 4.4 NudgeRule 2-tier 구조 (Implicit Intelligence)

```
[PatternEvent 데이터 누적]
        ↓
insights.service가 주기적으로 분석:
  - timeOfDay 히스토그램
  - dayOfWeek 패턴
  - location 클러스터링 (Toss ContextAdapter 데이터 누적 시)
  - 빈도 임계값 자동 도출
        ↓
시스템이 NudgeRule을 자동 생성/업데이트:
  origin: 'system_learned'
  confidence: 0~1 (이벤트 수, 시간 분산도 기반)
        ↓
confidence ≥ 0.6 → isEnabled=true 자동 활성화
confidence < 0.6 → "학습 중" 상태로 비활성
        ↓
사용자는 발화된 넛지에 ACCEPTED/IGNORED 등 반응 → confidence 재조정
```

**Tier 2 Explicit Override**: 파워 유저는 Settings 깊은 곳에서 `origin='user_created'` 룰을 수동 추가 가능. UI는 메인 플로우에서 노출 금지.

**confidence 계산 (초안)**:
```
support     = patternId의 PatternEvent 개수 / 14일 기간
consistency = 1 - stddev(occurredAt의 timeOfDay) / 12  (시간 일관성)
confidence  = clamp(support * 0.5 + consistency * 0.5, 0, 1)
```

### 4.5 BadPattern lifecycle

```
DRAFT → ACTIVE → (PAUSED ⇄ ACTIVE) → ARCHIVED
```
- DRAFT: 폼 작성 중 (Zustand만, DB 미저장)
- ACTIVE: isActive=true, 트리거/스트릭/학습 동작
- PAUSED: 휴가/병가 — 트리거/스트릭/학습 일시정지, 데이터 보존
- ARCHIVED: isActive=false, UI 숨김

### 4.6 Frontend Async State 패턴

```typescript
// src/lib/async-state.ts
export type AsyncState<T, E = AppError> =
  | { status: 'IDLE' }
  | { status: 'LOADING' }
  | { status: 'SUCCESS'; data: T }
  | { status: 'ERROR'; error: E; retryCount: number };
```

### 4.7 Retry & Timeout 정책

| Parameter | Value | 비고 |
|---|---|---|
| Max Retries | 3 | 📌 DEFAULT |
| Retry Strategy | Exponential Backoff | base × 2^n |
| Base Delay | 1000ms | |
| Toss SDK Call Timeout | 5000ms | |
| Dexie Op Timeout | 2000ms | |
| Circuit Breaker | No | phase 1 |

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (a) => Math.min(1000 * 2 ** a, 30000),
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
    mutations: { retry: 1 },
  },
});
```

### 4.8 Nudge Scheduler 플로우 (재설계)

```
[앱 활성 시 + 5분 주기 (활성 동안만)]
        ↓
useNudgeScheduler → nudgeService.evaluateRules()
        ↓
1. 미반응 DELIVERED 조회 → "놓친 넛지" UI 노출 (timestamp 무관)
2. 자정 경과 시 일괄 EXPIRED 정리
3. NudgeRule(isEnabled, confidence ≥ 0.6) 평가:
   - time:      현재 시각이 hour:minute 매치
   - frequency: 최근 windowMinutes 내 PatternEvent ≥ eventCount
   - location:  Toss ContextAdapter (있을 때만)
   - context:   외부 컨디션 (phase 2)
4. forceMode 해석:
   effectiveForceMode = pattern.forceModeOverride ?? user.forceMode
   toneVariant = effectiveForceMode ? 'force' : 'soft'
5. 매치 → NudgeDelivery(PENDING) → 즉시 DELIVERED
6. Toss PushAdapter.schedule()로 미래 시점 룰 사전 예약 (앱 비활성 대비)
        ↓
[insights.service 매일 1회 또는 PatternEvent 50건 누적 시]
   PatternEvent 분석 → system_learned 룰 자동 생성/업데이트
```

### ⚠️ §9에서 검증 필요 (블로커 가능성)

1. **Dexie/IndexedDB가 토스 미니앱 WebView에서 정상 작동하는지** — 토스 개발자 샌드박스 검증 필수
2. **WebView 스토리지 영속성** — 토스 앱이 캐시 정리 시 IndexedDB를 날리는지
3. **IndexedDB 용량 한계** — 시계열 PatternEvent가 누적되므로 GC 전략 필요
4. **Toss PushAdapter.schedule()의 실제 가능 시점** — 미래 시점 푸시 사전 예약이 SDK에서 지원되는지
5. **Playwright E2E는 Chrome 기준** → 토스 WebView regression은 별도 수동 QA 체크리스트

→ §9 Environment & Deployment에서 정식으로 다룸. **이 5개는 §3~§9 전체의 잠재 블로커**이므로 토스 개발자 측에 즉시 확인 필요 (팀 공유 액션 아이템).

---

## 5. Security & Validation ✅ LOCKED

### 5.1 위협 모델 (Local-first)

| 위협 | 가능성 | 대응 |
|---|---|---|
| 다른 origin의 IndexedDB 접근 | 낮음 | WebView origin isolation 신뢰, 토스 측 확인 |
| WebView 디버깅 모드 노출 | 중 | 프로덕션 빌드에서 디버깅 비활성 |
| XSS로 PatternEvent 조작 | 중 | React escape + DOMPurify (메모 렌더링 시) |
| 사용자 메모 민감정보 입력 | 중 | 가이드 + 200자 제한 + 검색 인덱싱 비활성 |
| 토스 SDK 토큰 탈취 | 중 | IndexedDB 평문 저장 금지, sessionStorage 사용 |
| 디바이스 분실 | 높음 | phase 2: Web Crypto API 로컬 암호화 |

### 5.2 인증

| Phase | 전략 |
|---|---|
| **phase 1** ✅ | 익명 사용자, uuid 자동 생성, 디바이스 단위 |
| phase 2 | Toss Login (`tossUserId` 매핑, 디바이스 간 동기화) |

### 5.3 권한

단일 사용자 환경 → RBAC 불필요. Repository 레벨 invariant로 cross-user 접근 차단:

```typescript
function assertOwnership(resourceUserId: string, sessionUserId: string): void {
  if (resourceUserId !== sessionUserId) {
    throw new ForbiddenError('CROSS_USER_ACCESS');
  }
}
```

phase 2 클라우드 동기화 시 정식 RBAC 매트릭스 작성 (별도 spec).

### 5.4 입력 검증 (Zod 단일 소스)

모든 외부 입력(form, URL param, Toss SDK response)은 Service 진입점에서 Zod로 검증. 실패 = `ValidationError`.

```typescript
const CreatePatternInputSchema = z.object({
  label: z.string().min(1).max(50),
  category: z.enum(['eating', 'screen', 'sleep', 'spending', 'custom']),
  severity: z.number().int().min(1).max(5),
  description: z.string().max(500).optional(),
  forceModeOverride: z.boolean().nullable().default(null),
});
```

**Schema 위치 룰**: Entity = `src/db/schema.ts`. Service input = 각 service 파일. 공통 필드는 `.pick()` / `.extend()`.

### 5.5 검증 규칙 (필드별)

| 필드 | 규칙 |
|---|---|
| `BadPattern.label` | 1~50자, trim |
| `BadPattern.description` | 0~500자 |
| `PatternEvent.note` | 0~200자 — **태그성 컨텍스트 신호**, DOMPurify로 렌더링 |
| `User.nickname` | 2~20자, 이모지 허용 |
| `NudgeRule.messageTemplate` | 1~200자, 자리표시자 검증 |
| 시간 필드 | epoch ms ≥ 0 |
| location | lat ∈ [-90, 90], lng ∈ [-180, 180] |

### 5.6 PatternEvent.note 역할 재정의 (중요)

`note`는 일기가 아니라 **컨텍스트 신호 (feature for learning)**.
- "스트레스받아서", "야근 후", "비 오니까" 같은 짧은 태그성 메모
- §4.4 Tier 1 시스템 학습 (insights.service)의 입력 feature
- UI 카피: "한 단어로 — 무엇이 트리거였나요?" (장문 작성 유도 금지)
- 검색 인덱싱 비활성, DB 풀텍스트 인덱스 생성 금지

### 5.7 PII 정책 — 받아오지 말고 추론한다

토스 SDK에서 인구통계학 PII를 받아오지 않음. 대신 **자체 페르소나**를 (사용자 입력 + 시스템 학습) 조합으로 구축.

```typescript
// src/lib/user-profile.ts (User.settings 안에 저장)
export const UserProfileSchema = z.object({
  // 온보딩에서 사용자가 직접 입력 (모두 선택)
  ageGroup: z.enum(['20s', '30s', '40s', '50s+']).optional(),
  occupation: z.enum(['office', 'freelance', 'student', 'homemaker', 'other']).optional(),
  activeHours: z.object({
    start: z.number().int().min(0).max(23),
    end: z.number().int().min(0).max(23),
  }).optional(),

  // 시스템이 PatternEvent에서 학습 (insights.service / LocalStatEngine)
  // ⚠️ phase 1: 처음 4개만 채워짐. responsePattern은 phase 2 서버사이드 분류기 도입 후
  inferred: z.object({
    peakRiskHours: z.array(z.number().int().min(0).max(23)).default([]),     // ✅ phase 1
    riskDaysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),     // ✅ phase 1
    avgDailyEvents: z.number().default(0),                                    // ✅ phase 1
    dominantCategory: z.string().optional(),                                  // ✅ phase 1
    responsePattern: z.enum([                                                 // ❌ phase 2
      'quick_responder',
      'delayed_responder',
      'selective_responder',
    ]).optional(),
  }).default({}),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
```

**저장 위치**: `User.settings.profile` (별도 테이블 분리 X, §3.6 결정 일관)

**활용**:
- `responsePattern === 'delayed_responder'` → NudgeDelivery EXPIRED 일괄 처리를 자정이 아닌 다음 활성 세션 종료 시점으로 연기
- `peakRiskHours` → system_learned 룰의 트리거 시간을 30분 선제로 자동 조정
- `dominantCategory` → 홈 화면 우선순위
- 온보딩 ageGroup/occupation → cold start 단계의 default 룰 시드

**규제 안전성**: 토스 SDK에서 받은 PII 0. 사용자가 자발적으로 입력한 카테고리 값(범위형) + 행동 데이터에서 도출된 추론값만 저장.

### 5.8 Hardening Checklist

- ✅ XSS: React escape + 사용자 메모는 DOMPurify
- ✅ CSP: Vite build에 strict CSP (토스 WebView 정책 확인 필요 → §9 블로커)
- ❌ CSRF: N/A phase 1
- ✅ Secrets: `import.meta.env.VITE_*`만, `.env*` gitignore
- ✅ Dependency Audit: `npm audit` CI
- ✅ PII 최소화: 토스 PII 0, 자체 페르소나 사용
- ✅ Logging: PatternEvent 내용/note 로그 출력 금지

---

## 6. Observability & Operations ✅ LOCKED

### 6.1 Logging

```typescript
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
interface LogEntry {
  timestamp: string;     // ISO8601
  level: LogLevel;
  traceId: string;       // 세션 단위 uuid
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}
```

| Level | 기준 | 출력 |
|---|---|---|
| ERROR | 처리 실패 | console + Sentry + IndexedDB ring buffer |
| WARN | 복구된 비정상 | console + Sentry breadcrumb |
| INFO | 비즈니스 이벤트 | console (dev) + Analytics |
| DEBUG | 개발 전용 | console (dev only) |

🔴 **사용자 콘텐츠 로그 출력 절대 금지** — `note`, `label`, `nickname` 등. 메타데이터는 ID + enum만.

### 6.2 Result<T, E> + AppError 계층

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(public readonly code: string, public readonly statusCode: number, public readonly details?: unknown) {
    super(code); this.name = this.constructor.name;
  }
}
export class ValidationError extends AppError { constructor(d: unknown) { super('VALIDATION_ERROR', 400, d); } }
export class NotFoundError extends AppError { constructor(r: string) { super(`${r.toUpperCase()}_NOT_FOUND`, 404); } }
export class ForbiddenError extends AppError { constructor(c: string) { super(c, 403); } }
export class StorageError extends AppError { constructor(d: unknown) { super('STORAGE_ERROR', 500, d); } }
export class TossSDKError extends AppError { constructor(c: string, d?: unknown) { super(`TOSS_${c}`, 502, d); } }
```

```typescript
// src/lib/result.ts
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Hook 레이어 unwrap 헬퍼 — Service는 Result, Component는 TanStack Query의 isError/error만
export function unwrapOrThrow<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw result.error;
}
```

**철칙**:
- 🔴 Service는 throw 대신 `Result<T, E>` 반환 (단 입력 검증 단계 ValidationError는 throw 허용)
- 🔴 Repository는 Dexie 예외를 catch → `StorageError`로 wrap → Result 반환
- 🔴 Hook의 TanStack Query queryFn 안에서 `unwrapOrThrow`로 변환 → Component는 Result를 모르고 `isError`만 사용
- 🔴 Hook 외부에서 `unwrapOrThrow` 호출 금지 (테스트 제외)

### 6.3 Error Boundary (2-tier)

```
<RootErrorBoundary>          ← 최후 fallback
  <Router>
    <RouteErrorBoundary>     ← 라우트별, 다른 화면은 살아있음
      <Page />
    </RouteErrorBoundary>
  </Router>
</RootErrorBoundary>
```

### 6.4 Analytics 이벤트 카탈로그

| 이벤트 | 메타데이터 |
|---|---|
| `app_session_start` | sessionId, traceId |
| `pattern_created` | category, severity, hasForceOverride |
| `nudge_delivered` | ruleOrigin, toneVariant, triggerType |
| `nudge_reaction` | reaction, latencyMs |
| `correction_logged` | outcome, hasReplacementAction, triggeredByNudge |
| `streak_state_changed` | oldState, newState, currentDays |
| `force_mode_toggled` | scope, newValue |
| `onboarding_completed` | hasAgeGroup, hasOccupation, patternsCreated |
| `error_occurred` | errorCode, service, traceId |

### 6.5 도구

| 카테고리 | 선택 | 비고 |
|---|---|---|
| Error Tracking | **Sentry** (phase 1부터) | ⚠️ §9에서 토스 WebView CSP 외부 도메인 허용 확인 필수 |
| Analytics | **TBD** — 토스 대시보드 vs PostHog | §9에서 토스 대시보드의 커스텀 이벤트 지원 여부 확인 후 결정 |
| Performance RUM | Sentry Performance | |
| Tracing | ❌ N/A | 단일 클라이언트 |
| Health Check | ❌ N/A | 백엔드 없음 |

🔴 **Sentry Replay/Session Replay 절대 사용 금지** (PII 누출 직결).

### 6.6 IndexedDB Ring Buffer (오프라인 로그)

WebView에서 Sentry 도달 실패 시 대비. 최근 200개 ERROR를 IndexedDB에 저장 → 다음 세션 flush.

### 6.7 Sentry 설정 (PII 보호)

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  beforeSend(event) { return scrubUserContent(event); }, // note/label/nickname redact
  defaultIntegrations: false,
  integrations: [/* console, http만 */], // Replay 제외
});
```

### 6.8 IndexedDB 데이터 수명 정책 (스토리지 보호)

토스 WebView 스토리지 한도 대응:
- **PatternEvent 90일 이전 데이터 자동 아카이브** — 일별 집계로 압축 후 원본 삭제
- 일별 집계 테이블 `patternEventDaily` 도입 (phase 1.1 — Dexie version 2)
- 스토리지 용량 모니터링: `navigator.storage.estimate()` 80% 초과 시 warning 로그
- 사용자에게 보이는 차트는 90일 이후엔 일별 집계 기반 (UX 차이 미미)

---

## 7. Concurrency & Idempotency ⏭️ NEXT

---

## 다음 단계 — 인터뷰 진행 상태

| Section | Status |
|---|---|
| 0. Project Identity | ✅ LOCKED |
| 1. Tech Stack | ✅ LOCKED |
| 2. Data Schema & API Contract | ✅ LOCKED |
| 3. Architecture & Design Patterns | ✅ LOCKED |
| 4. State Machine & Flow Control | ✅ LOCKED |
| 5. Security & Validation | ✅ LOCKED |
| 6. Observability & Operations | ✅ LOCKED |
| 7. Concurrency & Idempotency | ⏭️ NEXT |
| 8. Testing & Acceptance Criteria | ⬜ |
| 9. Environment & Deployment | ⬜ |
