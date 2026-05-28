# Fevio 아키텍처 리팩토링 계획

> North Star 철학 정합성 확보 + 잡초 제거. 과감한 삭제 허용.
> 기준: `docs/01-product/fevio-product-north-star.md`

---

## 진단 요약

### /demo 영역 — 대부분 완료

7-stage 마이그레이션은 코드 로직 기준으로 완료됐다.

| 파일 | 상태 |
|---|---|
| `app/demo/demo-scenarios.ts` | IvfStage 7개, DEMO_SCENARIOS 완전 구현 |
| `app/demo/demo-state.ts` | DemoState, demoReducer, getVisiblePartnerCards, ActionLog |
| `app/demo/intro-landing.tsx` | orbit + mobile fallback + footer |
| `app/demo/dual-panel-demo-client.tsx` | useReducer, 7 stage pills, URL routing, SharedCareStatePanel |
| `app/demo/page.tsx` | searchParams, normalizeMode/normalizeStage |
| `app/demo/patient-panel.tsx` | IvfStage-keyed, `styles[phaseHero_${accent}]` 사용 |
| `app/demo/partner-panel.tsx` | IvfStage-keyed, `styles[partnerHero_${accent}]` 사용 |

**수정 완료**: 컴포넌트가 호출하는 `phaseHero_coral/sage/lavender`와 `partnerHero_coral/sage/lavender`가 CSS 모듈에 존재한다. 구버전 3-scene phase 클래스는 코드에서 제거됐다.

### SLC 실제 앱 영역 — 중복 파일

| 파일 | 역할 | 문제 |
|---|---|---|
| `src/lib/presentation-demo-data.ts` | presentation mode 카드 seed (injection-day 전용) | `presentation-scenarios.ts`와 기능 중복. injection-day만 커버해 불완전 |
| `src/features/adaptive-home/presentation-scenarios.ts` | presentation mode 카드 seed (5 care params) | 더 완전한 버전. 이것이 정본 |
| `src/types/presentation-demo.types.ts` | PresentationCareActionCard 타입 | 위 두 파일 모두 사용. 유지 필요 |

→ `presentation-demo-data.ts` 삭제, import를 `presentation-scenarios.ts`로 일원화.

### 용어 분열 — 이전 표현 잔존

North Star는 표현을 **State-driven Generative UI**로 통일한다. 이전 표현은 `docs/`와 `tests/`에서 남기지 않는다.

| 위치 | 잔존 형태 |
|---|---|
| `docs/04-decisions/0009-state-driven-generative-ui.md` | 파일명 + 제목 + 내용 전체 |
| `docs/design/fevio-design-philosophy.md` | 섹션 3.5 제목/내용 |
| `docs/02-design/cinematic-care-surface.md` | 본문 |
| `docs/04-decisions/0010-clinicday-context-review-session.md` | 본문 다수 |
| `docs/02-design/clinic-day-context-review.md` | 본문 |
| `tests/unit/state-driven-generative-ui-adr.test.ts` | 파일명 + ADR 경로 참조 |
| `tests/integration/care-surface-rule-authoring.test.ts` | describe 블록 이름 |
| `tests/unit/care-os-architecture.test.ts` | it() 블록 설명 |

### 도메인 고아 파일 — 연결 여부 불분명

| 파일 | 우려 |
|---|---|
| `src/domain/partner-role-projection.ts` | `demo-state.ts`의 `getVisiblePartnerCards`와 로직 중복 가능성 |
| `src/domain/care-os-architecture.ts` | UI 또는 테스트에서 호출되는지 불분명 |
| `src/domain/result-protection.ts` | `result-protection-home.tsx`와 실제 연결 여부 확인 필요 |
| `src/domain/two-week-wait.ts` | `two-week-wait-home.tsx`와 실제 연결 여부 확인 필요 |

---

## 삭제 목록 (DELETE — 잡초 제거)

과감하게 삭제한다. 삭제 후 typecheck, build 통과로 검증.

### 파일 삭제

| 파일 | 이유 | 선행 조건 |
|---|---|---|
| `src/lib/presentation-demo-data.ts` | `presentation-scenarios.ts`로 완전 대체 가능 | import 경로 이전 완료 후 |

### CSS 클래스 삭제

파일: `app/demo/dual-panel-demo.module.css`

```css
/* 삭제 대상 — 3-scene 잔존 클래스 */
.phaseHero_injection  { ... }
.phaseHero_clinic     { ... }
.phaseHero_waiting    { ... }
.partnerHero_injection { ... }
.partnerHero_clinic    { ... }
.partnerHero_waiting   { ... }
```

이 클래스들은 더 이상 컴포넌트에서 참조되지 않는다. patient-panel, partner-panel 모두 `accent`(coral/sage/lavender) 기반 클래스로 전환됐다.

---

## 버그 수정 목록 (FIX — 삭제 전에 먼저)

### CSS 클래스 누락 (데모 스타일 깨짐)

파일: `app/demo/dual-panel-demo.module.css`

추가해야 할 클래스:

```css
/* phaseHero accent variants */
.phaseHero_coral    { background: var(--color-coral-gradient, ...); }
.phaseHero_sage     { background: var(--color-sage-gradient, ...); }
.phaseHero_lavender { background: var(--color-lavender-gradient, ...); }

/* partnerHero accent variants */
.partnerHero_coral    { ... }
.partnerHero_sage     { ... }
.partnerHero_lavender { ... }

/* appScreen accent variants */
.accent_coral    { --accent: var(--color-coral); }
.accent_sage     { --accent: var(--color-sage); }
.accent_lavender { --accent: var(--color-lavender); }
```

기존 `phaseHero_injection → coral`, `phaseHero_clinic → sage`, `phaseHero_waiting → lavender`로 스타일 값을 재매핑하면 된다.

---

## 통합 목록 (MERGE)

### presentation-demo-data.ts → presentation-scenarios.ts

1. `app/(authed)/home/page.tsx` — `presentation-demo-data` import를 `presentation-scenarios`로 교체
2. `app/capture/page.tsx` — 동일
3. `app/partner/[token]/page.tsx` — 동일
4. `getPresentationClinicMemo()`, `getPresentationPartnerView()` 함수가 `presentation-scenarios.ts`에 없다면 이전해서 추가
5. typecheck 통과 확인 후 `src/lib/presentation-demo-data.ts` 삭제

### partner-role-projection.ts vs demo-state.ts

`src/domain/partner-role-projection.ts`의 projection 로직과 `demo-state.ts`의 `getVisiblePartnerCards`를 비교한다.

- 로직이 동일하면: demo-state.ts가 domain 함수를 호출하도록 전환하고 중복 제거
- 로직이 다르면: 두 파일의 책임 분리를 명확히 주석으로 표시

---

## 용어 통일 목록 (RENAME)

이전 표현을 모두 **State-driven Generative UI**로 치환한다.

### ADR 0009 업데이트

파일: `docs/04-decisions/0009-state-driven-generative-ui.md`

- 파일명은 그대로 유지 (ADR 번호 보존, 링크 안정성)
- 제목: `ADR 0009 — State-driven Generative UI Care Surface via TPO specificity-first rules` → `ADR 0009 — State-driven Generative UI via governed component selection`
- 본문: "state-driven Generative UI" 전수 치환 + 철학 설명 업데이트
- `docs/04-decisions/README.md` 링크 텍스트도 업데이트

### 테스트 파일 업데이트

| 파일 | 변경 |
|---|---|
| `tests/unit/state-driven-generative-ui-adr.test.ts` | 파일명 → `state-driven-generative-ui-adr.test.ts`. ADR 파일 경로 참조는 그대로 유지 |
| `tests/integration/care-surface-rule-authoring.test.ts` | describe `'state-driven Generative UI rule authoring'` → `'state-driven Generative UI rule authoring'` |
| `tests/unit/care-os-architecture.test.ts` | it() 블록의 "state-driven Generative UI" 언급 업데이트 |

### 설계 문서 업데이트

| 파일 | 변경 |
|---|---|
| `docs/design/fevio-design-philosophy.md` | 섹션 3.5 제목: "State-driven Generative UI Care OS" → "State-driven Generative UI Care OS". 본문 용어 치환 |
| `docs/02-design/cinematic-care-surface.md` | 본문 "state-driven Generative UI" 치환 |
| `docs/04-decisions/0010-clinicday-context-review-session.md` | "State-driven Generative UI scope" 섹션 제목 + 본문 치환 |
| `docs/02-design/clinic-day-context-review.md` | "State-driven Generative UI boundary" 섹션 치환 |

---

## 도메인 연결 감사 (AUDIT)

삭제/통합보다 신중하게. 먼저 확인 후 결정.

```bash
# 각 도메인 파일이 어디서 import되는지 확인
grep -rn "care-os-architecture\|partner-role-projection\|result-protection\|two-week-wait" \
  app/ src/ --include="*.ts" --include="*.tsx"
```

| 도메인 파일 | import 없으면 | import 있으면 |
|---|---|---|
| `partner-role-projection.ts` | demo-state.ts로 흡수하거나 삭제 | 책임 분리 명시 |
| `care-os-architecture.ts` | 테스트에서만 참조면 유지, 그렇지 않으면 삭제 검토 | 현상 유지 |
| `result-protection.ts` | `result-protection-home.tsx`와 연결 확인 | 현상 유지 |
| `two-week-wait.ts` | `two-week-wait-home.tsx`와 연결 확인 | 현상 유지 |

---

## 실행 순서

```
Phase 0 (지금)
  ① README.md — North Star 한 줄 추가 ✅

Phase 1 (데모 버그 우선)
  ② dual-panel-demo.module.css — phaseHero_coral/sage/lavender 추가
  ③ dual-panel-demo.module.css — phaseHero_injection/clinic/waiting 삭제
  ④ Vercel-visible 검증: /demo?mode=stage&stage=2 → 스타일 정상 확인

Phase 2 (SLC 코드 일원화)
  ⑤ presentation-demo-data.ts import 3곳 → presentation-scenarios.ts 이전
  ⑥ getPresentationClinicMemo, getPresentationPartnerView 이전 (없으면)
  ⑦ presentation-demo-data.ts 삭제
  ⑧ typecheck + build 통과 확인

Phase 3 (용어 통일)
  ⑨ ADR 0009 제목 + 본문 업데이트
  ⑩ 설계 문서 4개 state-driven Generative UI 치환
  ⑪ tests/unit/state-driven-generative-ui-adr.test.ts 파일명 변경
  ⑫ 테스트 describe/it 블록 이름 업데이트
  ⑬ npm test 통과 확인

Phase 4 (도메인 감사 — 신중하게)
  ⑭ grep으로 고아 도메인 파일 import 여부 확인
  ⑮ partner-role-projection vs getVisiblePartnerCards 비교
  ⑯ 중복이면 통합, 고아면 삭제
  ⑰ 실제 연결된 도메인은 ownership 테스트로 고정 ✅
```

---

## 완료 기준

```
Phase 1: /demo?mode=stage&stage=2 → 스타일이 정상 렌더링됨 (accent별 색상 구분)
Phase 2: npm run build — presentation-demo-data 참조 0건
Phase 3: previous-term grep docs/ tests/ — 0건
Phase 4: 고아 도메인 파일 없음 또는 연결 명시
```

---

## 이 계획이 따르지 않는 것

- 기능 추가 없음
- 새 abstraction 없음
- SLC 실 기능(home/capture/partner 페이지 동작) 변경 없음
- RLS/보안 경계 변경 없음


## 실행 결과 (2026-05-12)

| Phase | 결과 | 검증 |
|---|---|---|
| Phase 1 | `/demo` accent class 정합성 복구, legacy 3-scene class 제거 | `tests/unit/demo-panel-contract.test.ts` |
| Phase 2 | `presentation-demo-data.ts` 삭제, `presentation-scenarios.ts`로 일원화 | `presentation-demo-data` 앱/소스/테스트 참조 0건 |
| Phase 3 | 이전 표현을 `State-driven Generative UI`로 통일 | 이전 표현 검색 0건 |
| Phase 4 | 도메인 파일은 고아가 아니므로 삭제하지 않음. real partner projection과 demo projection은 책임이 다르다. | `tests/unit/domain-ownership.test.ts` |

Phase 4 ownership:

- `partner-role-projection.ts`: 실제 partner API/service의 care-card projection. `/demo`의 `getVisiblePartnerCards`는 `requiresSharingLevel` 기반 발표용 projection이므로 통합하지 않는다.
- `care-os-architecture.ts`: home, onboarding, partner assist/cards API에 연결된 Care OS rule surface.
- `result-protection.ts`: result-protection adaptive home surface에 연결.
- `two-week-wait.ts`: 2WW adaptive home surface에 연결.
