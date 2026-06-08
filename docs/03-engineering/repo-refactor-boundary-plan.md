# Fevio 리포지토리 리팩토링 안전 경계 계획서 (Repo Refactor Boundary Plan)

본 문서는 Fevio 프로젝트의 안정성을 최우선으로 유지하면서 수행 가능한 리팩토링의 범위, 원칙 및 단계별 실행 계획을 정의하는 Handoff 문서입니다. Fevio는 현재 `care_action_cards` 전환, 파트너 개인정보 보호(Partner Privacy), 레거시 `schedule_items` fallback 로직이 밀접하게 얽혀 있으므로, 안정성이 검증되지 않은 대규모 구조 변경이나 기능 제거를 엄격히 제한합니다.

---

## 1. 기준선 (Baseline) 및 PR 상태

리팩토링 작업을 시작하기 전에 아래의 기준선과 미결 PR(Pending PR) 상태를 명확히 분리하여 작업 범위를 한정합니다.

* **기준선 Commit**: `origin/main` (`5ac0f2149fc7d809d006adb070882e8793cedcac`)
* **미결 PR 상태 (2026-06-08 17:36 KST 기준)**:
  * **PR #447 (Slice 5 regression sweep)**: **OPEN (미병합)**
    * *영향*: 아직 병합되지 않았으므로 Slice 5 회귀 방지 스윕 결과는 리팩토링 기준선에 포함하지 않으며, 기존 main의 동작 방식을 준수합니다.
  * **PR #448 (docs/spec-map)**: **OPEN (미병합)**
    * *영향*: 아직 병합되지 않았으므로 `docs/spec-map`을 리포지토리 탐색의 기준으로 삼지 않습니다.
* **불변 원칙**: 병합 전인 "Pending PR" 기준과 "main" 기준의 코드를 절대 혼용하거나 섞지 않습니다.

---

## 2. 리팩토링 가능 영역 (허용 기준)

Fevio의 리팩토링은 **"동작·데이터·사용자 플로우를 바꾸지 않는 구조 정리 및 테스트 고정"**의 범주 안에서만 허용됩니다.

### ① 문서 및 리포지토리 탐색 정리 (Docs / Repo Navigation)
* **허용 작업**:
  * `README.md`, `docs/README.md`, `docs/SPEC_INDEX.md` 파일들의 탐색 링크 및 구조 정리.
  * Product / Engineering / Decisions / Archive의 디렉토리 경계 명확화.
  * 기한이 만료되거나 최신이 아닌 설계 문서에 `[현재 기준 아님 / Historical]` 경고 문구 추가.
  * 온보딩(Onboarding) 문서에 핵심 라우트(Route) 및 데이터 계약 구조 문서화.
* **금지 작업**:
  * 문서 정리 과정에서 실제 애플리케이션의 동작 방식을 기획 수준으로 과장하여 작성하는 행위.
  * 대기 중인 PR(#447, #448)의 작업 사항을 이미 구현 완료된 것처럼 기술하는 행위.

### ② 동작 고정용 캐릭터라이제이션 테스트 (Characterization Test) 추가
코드 정리 전에 기존 동작 계약을 명확하게 테스트 코드로 고정해야 합니다. 고정 대상 계약은 다음과 같습니다:
* **`/home` Today Loader**: `care_action_cards`를 우선하여 조회하되, 데이터가 없는 경우 `schedule_items` fallback을 유지해야 합니다.
* **`/add` 및 `/clinic-update`**: Primary User의 일정/메모 등록 사용자 플로우를 온전히 유지하고, 하위 호환성을 위한 read/write fallback을 임의로 제거하지 않습니다.
* **`/calendar` 및 `/schedule`**: 기존 일정 표시, 완료 상태 변경 및 수정 동작 계약을 보존합니다.
* **`/partner`**:
  * `partner_visible = true` 데이터만 노출해야 합니다.
  * 승인된 관계(`linked patient/couple scope`) 내의 데이터만 격리 조회되어야 합니다.
  * `serializePartnerViewCards`에 의한 필터링 및 프로젝션(Projection)이 정확해야 하며, 환자의 민감한 의료 원문(`raw clinical text`)이 노출되어서는 안 됩니다.
  * 파트너 뷰 렌더링 시 `schedule_items` fallback을 사용해서는 안 됩니다.
* **임신 대기 기간 (Result Protection Mode)**:
  * 임신 결과 압박, 다음 주기 스케줄 유도, 또는 임의의 파트너 자동 브로드캐스트를 전면 제한합니다.

### ③ 문서 및 자산(Asset) 아카이빙 이동
* **허용 작업**:
  * 더 이상 사용되지 않는 프로토타입/데모/예시 자료를 `docs/archive` 또는 역사적 참고 자료 영역으로 이동.
  * 마크다운 링크 깨짐 방지를 위해 `git mv` 명령을 사용하여 안전하게 이동.
* **금지 작업**:
  * 애플리케이션 빌드 타임에 Next.js 등에서 실제 import하여 사용하는 정적 자산을 아카이브 폴더로 이동하는 행위.
  * 한 PR 내에 기능 코드 리팩토링과 문서 이동 작업을 동시에 섞어 넣는 행위.

### ④ 모듈 경계 및 Import 경로 정리
* **허용 작업**:
  * `src/features/partner/*` 등 개별 기능 영역 내부의 import 경로를 정리하고 순환 참조(Circular Dependency) 해제.
  * API 라우트 로더에서 순수 데이터 프로젝션 및 헬퍼(Helper) 함수 분리.
  * 코드 중복을 피하기 위해 select string이나 mapper를 기존 Service 파일로 이관.
  * 타입 이름을 정리하되, 하위 호환을 위한 `compatibility alias`를 유지하여 기존 코드 손상을 방지.
* **금지 작업**:
  * `/home`, `/add`, `/clinic-update`, `/partner` 등의 주요 진입점을 한 번에 수정하여 불안정성을 키우는 행위.
  * 리팩토링 과정에서 `schedule_items` fallback 로직이나 DB 스키마/RLS 설정을 건드리는 행위.

---

## 3. 리팩토링 금지 영역 (Refactoring Non-goals)

아래 항목들은 단순한 코드 정리 수준을 벗어나는 **제품 변경/마이그레이션 영역**이므로, 별도의 동의 및 기획 없이 리팩토링 범위 내에서 수정할 수 없습니다.

1. **데이터베이스 스키마 및 RLS 수정**: Supabase 마이그레이션 파일 추가, RLS 정책 수정, 테이블/컬럼의 이름 변경 또는 삭제 금지.
2. **사용자 핵심 흐름 변경**: `/add`, `/clinic-update`, `/home`, `/calendar`, `/partner` 진입점의 핵심 UX 및 파라미터 변경 금지.
3. **파트너 프라이버시 경계 수정**: 민감 정보의 파트너 노출 허용, `partner_visible` 필터 조건 완화, Couple Scope 격리 정책 해제 금지.
4. **`schedule_items` Fallback 제거**: 마이그레이션 기획 문서 작성 및 데이터 정합성 보존 테스트가 선행되어야 하며, 리팩토링 중 임의 제거 금지.
5. **도메인 핵심 용어 변경**: `care_action_cards`, `split_candidates`, `schedule_items`, `partner_visible`, `Result Protection Mode` 등의 데이터베이스/비즈니스 명칭 변경 금지.

---

## 4. 단계별 권장 실행 계획 (PR Slicing Plan)

리팩토링은 아래와 같이 영향 범위가 가장 좁고 안전한 단위부터 단계별 PR로 쪼개어 실행합니다.

### [PR A] 리팩토링 Boundary 문서화 (본 PR)
* **PR 타이틀**: `docs: define repo refactor boundary without product behavior changes`
* **대상 파일**: `docs/03-engineering/repo-refactor-boundary-plan.md` (본 문서 추가)
* **검증**: `git diff --check`

### [PR B] 계약 고정 테스트 추가 (Contract Tests)
* **PR 타이틀**: `test: lock care-action and partner privacy contracts before refactor`
* **대상 작업**: 파트너 격리 범위 테스트, RLS 경계 검증, 홈화면 Fallback 검증, 민감 텍스트 차단 검증 테스트 추가.
* **검증**: `npm run test`, `npm run typecheck`, `npm run build`

### [PR C] 기획/디자인 문서 정리
* **PR 타이틀**: `docs: separate current specs from historical planning material`
* **대상 작업**: 기획서 버전 정리 및 레거시 아카이빙.
* **검증**: `git diff --check`

### [PR D] 파트너 및 홈 화면 모듈 정리
* **PR 타이틀**: `refactor: clarify partner card read projection without changing behavior`
* **대상 작업**: 파트너 프로젝션 헬퍼 리팩토링 및 클린업.
* **검증**: `npm run test`, `npm run build`

---

## 5. 최종 인수 조건 (Acceptance Criteria)

모든 리팩토링 완료 판단은 아래의 조건이 모두 참(True)일 때만 인정됩니다:
* [ ] 사용자 화면(Route) 및 핵심 사용자 플로우에 변동이 없음.
* [ ] 파트너 프라이버시 불변성(Privacy Invariants)이 손상되지 않고 보존됨.
* [ ] `schedule_items` fallback 로직이 임의로 제거되지 않고 유지됨.
* [ ] DB 스키마 및 RLS 파일에 변경 사항이 없음.
* [ ] 모든 테스트 스위트가 통과함 (`npm run test` -> Green).
* [ ] 타입스크립트 컴파일 에러가 없음 (`npm run typecheck` -> Green).
* [ ] 프로덕션 빌드가 성공함 (`npm run build` -> Green).
* [ ] 공백 에러가 없음 (`git diff --check` -> Green).
* [ ] main 기준 코드와 병합 대기 중인 PR 기능들이 명확히 구분되어 서술됨.

---

## 6. 추가 리팩토링 가드레일 (Additional Refactor Guardrails)

### ① 리팩토링 중 배럴 익스포트 금지 (No Barrel Exports During Refactor)
* **내용**: 화면(Surface) 리팩토링 중 broad `index.ts` 배럴 익스포트를 추가하지 마십시오. 모든 헬퍼 모듈은 소스 모듈 경로에서 직접 import해야 합니다.
* **이유**: 공유 UI, 라우트 로더, 도메인 헬퍼가 이미 서로 교차 링크되어 있습니다. 배럴 익스포트는 의존성 방향을 숨기고 순환 참조(circular import)를 유발할 수 있습니다.

### ② 환자/파트너 프로젝션 통합 금지 (No Patient/Partner Projection Unification)
* **내용**: 환자용 로더와 파트너용 프로젝션 로더를 병합하지 마십시오. 파트너 화면은 기존의 안전 프로젝션 헬퍼(`serializePartnerViewCards` / `translateCareCardToPartnerRole` 등) 또는 그 직계 후속 함수를 활용한 별도의 정제된 프로젝션 경로를 유지해야 합니다.
* **이유**: 파트너 뷰는 지원용 화면입니다. 정제되지 않은 진료 원본 텍스트, 환자 전용 필드, 미승인 케어 액션, 또는 파트너 비노출 기록을 노출해서는 안 됩니다.

### ③ 리팩토링 중 schedule_items 클린업 금지 (No schedule_items Cleanup Under Refactor)
* **내용**: `schedule_items`를 죽은 코드가 아닌 활성 상태의 레거시 호환성(Active Legacy Compatibility) 코드로 취급하십시오. 리팩토링 PR에서 `schedule_items` 관련 read/write/fallback 동작을 제거, 이름 변경 또는 단순화하지 마십시오.
* **이유**: 제거 시에는 별도의 데이터 마이그레이션 이슈, 테스트, 롤백 계획 및 메인테이너 승인이 포함된 제품/데이터 마이그레이션 기획이 필요합니다.

### ④ 코드 변경과 자산(Asset) 이동 혼용 금지 (No Asset Moves Mixed with Code Changes)
* **내용**: 애플리케이션 코드 변경과 동일한 PR에서 `public/*`, `src/assets/*` 또는 import되는 정적 자산을 이동하지 마십시오. 문서 및 아카이브 클린업은 `git mv`를 활용한 docs-only로 진행해야 합니다.

### ⑤ Phase 2는 반드시 Test-only로 진행 (Phase 2 Must Be Test-only)
* **내용**: 어떠한 화면 리팩토링 전에도 반드시 기존 동작을 보존하는 캐릭터라이제이션 테스트를 추가해 아래 계약을 고정해야 합니다:
  * 파트너 노출 조건(`partner_visible = true`) 및 연결된 환자/커플 격리 범위(linked patient/couple scope)
  * 파트너 응답 페이로드 내 진료 원문(`raw clinical text`) 포함 배제
  * 파트너를 대상으로 한 환자용 프로젝션의 재사용 금지
  * `care_action_cards` Canonical-first 읽기 동작
  * `schedule_items` Fallback 보존
  * `/add` 및 `/clinic-update` 호환성 동작
  * 커버 가능한 범위 내에서의 임신 대기 기간(Result Protection Mode) 안전 동작
* **이유**: Phase 2 PR은 애플리케이션의 동작(app behavior)을 변경해서는 안 됩니다.

### ⑥ compat/legacy 폴더 물리 이동 연기 (Deferring Physical Move of compat/legacy Folders)
* **내용**: `compat/legacy` 관련 파일들의 물리적 디렉토리 이동을 첫 리팩토링 PR에 포함하지 마십시오.
* **이유**: `git mv`와 이에 수반되는 import 경로 수정은 다른 작업 브랜치와의 코드 충돌 및 변경 리스크가 매우 큽니다. 이는 Phase 4 이후, 특정 surface의 동작이 완전히 안정화된 뒤 별도의 독립된 PR로 분리하여 진행해야 합니다. 지금 단계에서는 파일 이동보다 Facade 이름을 통해 구조적 신호를 주는 방식을 채택합니다.

---

## 7. 안전한 리팩토링 하에서의 권장 가독성 기법 (Preferred Readability Techniques under Safe Refactor)

안전한 리팩토링(Safe Refactor)이 코드의 가독성을 방치하거나 복잡한 상태로 남겨두는 것을 의미하지는 않습니다. 개발자가 구조를 쉽게 이해할 수 있도록 **파일 이동 대신 facade 이름과 JSDoc 등으로 구조적 신호(Architectural Signalling)를 주는 기법**을 선호합니다.

### ① Facade / Strangler 패턴
라우터 핸들러나 페이지 컴포넌트 진입점에서는 비즈니스 의도가 명확히 드러나는 facade 함수를 호출하고, 복잡한 legacy fallback 로직은 facade 함수 내부로 격리합니다.
* **동작 방향**: Route/Page 코드는 명확히 정의된 도메인 함수를 호출해야 하며, 복잡한 legacy fallback 브랜치는 내부 함수에서 처리되어야 합니다.
* **예시**:
  * Route/Page 진입점 호출 함수:
    * `getPartnerVisibleCareCards()`
    * `readCanonicalPartnerCareCards()`
    * `projectPartnerSafeCards()`
  * 내부 Legacy Fallback 격리 함수:
    * `getDailyCareActionsWithLegacyFallback()`

### ② JSDoc `@deprecated` 활용
리팩토링 과정에서 `schedule_items` 전용 헬퍼, 타입, 또는 함수를 다룰 때는 `@deprecated` 어노테이션과 함께 명확한 가이드를 작성하여 신규 개발자가 레거시 경로를 사용하지 않도록 유도합니다.
* **예시**:
  ```ts
  /**
   * @deprecated Legacy schedule_items compatibility fallback.
   * New read paths should prefer care_action_cards.
   * Do not remove under refactor; requires a migration issue.
   */
  ```

### ③ 흐름 지도 (Flow Maps) 추가
위험도가 높은 데이터 읽기/쓰기 경로 근처나 추출된 서비스 상단에 짧은 흐름 설명 주석(Flow comment/doc block)을 추가하여 동작 방식을 명시합니다.
* **환자 케어 액션 조회 흐름 (Patient care action read)**:
  `care_action_cards canonical read` → `legacy schedule_items compatibility fallback` → `merged/de-duplicated projected care actions`
* **파트너 조회 흐름 (Partner read)**:
  `approved partner link` → `scoped care_action_cards where partner_visible=true` → `partner-safe projection` → `no schedule_items fallback` → `no raw clinical text`

---

## 8. Codex 리팩토링 프롬프트 추가 지침 (Codex Refactor Prompt Integration)

Codex 및 AI 어시스턴트를 활용할 때 아래의 규칙을 리팩토링 프롬프트에 추가하십시오:

* **Goal**: Make the public read flow clean while preserving legacy fallback internally.
* **Preferred direction**:
  * Route/page code should call clearly named domain functions (Use facade/strangler pattern where helpful).
  * Complex legacy fallback branches may remain, but should live behind intent-revealing functions.
  * Add JSDoc `@deprecated` to legacy `schedule_items`-only helpers/types/functions touched in this PR.
  * Do not mark the DB table itself as removed or safe to delete.
  * Use wording: "legacy compatibility fallback", not "dead code".
