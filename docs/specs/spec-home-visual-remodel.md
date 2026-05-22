# Spec: 홈 화면 비주얼 리모델링

## 목적

care-day별 홈 화면의 시각 레이어(배경, 히어로 영역, 카드, 이미지 에셋)를 전면 재설계한다.
기능·도메인 로직·데이터 계약은 변경하지 않는다.

---

## 범위

### 변경 대상

| 레이어                  | 설명                                                |
| ----------------------- | --------------------------------------------------- |
| `CareSurfaceFrame` 배경 | CSS 그라데이션 → 이미지 + 그라데이션 오버레이 혼합  |
| `CompactHeroGreeting`   | 타이포그래피 규모·간격·배치 재조정                  |
| `MissionCardPair`       | 카드 소재(유리/불투명 전환), 타이포 스케일          |
| `QuickStatRow`          | 셀 배경·경계 처리 조정                              |
| `CarePhaseStrip`        | 탭 형태·활성 상태 처리                              |
| `QuietChecklist`        | 아이템 카드 소재·간격                               |
| `PartnerConnectBar`     | 배치·소재 조정                                      |
| phase별 CSS 변수        | 색상 토큰 재조정 (sage/coral/lavender/warm neutral) |
| home 배경 이미지 에셋   | `public/assets/home/*.png` 신규 적용 (완료)         |
| `slc-assets.ts`         | 새 에셋 경로·크기 등록                              |

### 변경 금지 (기능 손대지 않음)

- `src/domain/` 전체
- `src/types/` 전체
- `care-surface-engine.ts`, `care-surface-rule.schema.ts`, `config/care-surface-rules.json`
- `home-composition.ts`, `care-cards.ts`, `treatment-timeline.ts`
- `adaptive-home-runtime.tsx` (라우팅·care-day 분기 로직)
- `home-page-loader.tsx` (데이터 로딩)
- `HomeUtilityLauncher` 동작
- Supabase 쿼리·RLS 정책·마이그레이션

---

## 구현 위치

| 파일                                                            | 작업                                         |
| --------------------------------------------------------------- | -------------------------------------------- |
| `src/features/adaptive-home/care-surface-primitives.module.css` | phase 배경·컴포넌트 비주얼 재작성            |
| `src/features/adaptive-home/care-surface-primitives.tsx`        | `CareSurfaceFrame`에 배경 이미지 레이어 추가 |
| `src/features/adaptive-home/injection-day-home.tsx`             | 비주얼 레이아웃 조정 (로직 동결)             |
| `src/features/adaptive-home/clinic-day-home.tsx`                | 비주얼 레이아웃 조정 (로직 동결)             |
| `src/features/adaptive-home/waiting-day-home.tsx`               | 비주얼 레이아웃 조정 (로직 동결)             |
| `src/features/adaptive-home/routine-day-home.tsx`               | 비주얼 레이아웃 조정 (로직 동결)             |
| `src/features/adaptive-home/two-week-wait-home.tsx`             | 비주얼 레이아웃 조정 (로직 동결)             |
| `src/features/adaptive-home/result-protection-home.tsx`         | 비주얼 레이아웃 조정 (로직 동결)             |
| `src/design/slc-assets.ts`                                      | home 이미지 슬롯 경로·크기 업데이트          |
| `public/assets/slc/home-*.png`                                  | 신규 이미지 파일 추가                        |

---

## 이미지 통합 방식

### 배경 이미지 레이어 (CareSurfaceFrame)

`CareSurfaceFrame`의 `::before` pseudo-element 또는 별도 `<div aria-hidden>` 레이어에 phase별 배경 이미지를 삽입한다.
기존 CSS 그라데이션은 이미지 위 오버레이로 유지하여 텍스트 가독성을 보호한다.

```
[배경 이미지 레이어]  ← 새로 추가 (decorative, aria-hidden)
[그라데이션 오버레이] ← 기존 surfaceFrame 배경 (불투명도 조정)
[grain texture]      ← 기존 유지
[콘텐츠 레이어]      ← 변경 없음
```

이미지는 `object-fit: cover`, `object-position: top center` 기준으로 배치한다.
`prefers-reduced-motion` 환경에서도 정적 이미지는 유지한다.

### phase별 이미지 슬롯

| Phase           | 이미지 키                                 | 용도             |
| --------------- | ----------------------------------------- | ---------------- |
| `injection`     | `slcAssets.home.injection`                | 주사일 배경      |
| `clinic`        | `slcAssets.home.clinic`                   | 병원 방문일 배경 |
| `waiting`       | `slcAssets.home.waiting`                  | 대기일 배경      |
| `two_week_wait` | `slcAssets.home.waiting` (공유) 또는 신규 | 2WW 배경         |
| `routine`       | `slcAssets.home.empty`                    | 루틴일 배경      |

> 이미지가 없을 경우 기존 CSS 그라데이션만 표시한다 (graceful fallback).

### 에셋 등록 규칙

- `slc-assets.ts`의 `home` 네임스페이스 아래 등록
- 모든 home 배경 이미지는 `decorativeAsset()` 사용 (alt 없음, aria-hidden)
- 파일명 규칙: `home-{phase}-bg[-v{n}].{ext}`

---

## phase별 비주얼 방향

### injection (주사일)

- 배경: warm coral-peach 계열 이미지 + 기존 coral 그라데이션 오버레이
- 히어로: 타이포 크기 유지, 여백 확대
- 카운트다운 히어로: 아크 컴포넌트 스타일 유지 (기존 `InjectionCountdownArc` 동결)

### clinic (병원 방문일)

- 배경: sage-green 계열 이미지 + 기존 sage 그라데이션 오버레이
- MissionCardPair: 카드 불투명도 높여 이미지 위 가독성 확보

### waiting (대기일)

- 배경: lavender 계열 이미지 + 기존 lavender 그라데이션 오버레이
- 전반적으로 조용하고 낮은 채도 유지

### two_week_wait (이식 후 대기)

- 배경: waiting과 유사하되 채도 더 낮게
- `intensity` 기본값 0.2 유지 (코드 동결)

### routine (루틴)

- 배경: warm neutral 계열 이미지 + 기존 neutral 그라데이션
- 가장 낮은 시각적 강도

---

## CSS 토큰 재조정 범위

phase별 CSS 변수는 재조정 가능하되, 변수 **이름**은 유지한다:

```css
--phase-base-start
--phase-base-end
--phase-bloom-strong
--phase-bloom-soft
--phase-ink
--phase-muted
--phase-accent
--phase-accent-deep
--phase-glass
```

전역 토큰(`--slc-*`, `--fevio-*`)은 `care-surface-primitives.module.css` 밖에서 정의되므로 이 스펙 범위에서 변경하지 않는다.

---

## 완료 기준 (Definition of Done)

### 기술 검증

- `npm run typecheck` (`tsc --noEmit`) 통과
- 기존 단위·통합 테스트 전체 통과 (새 테스트 불필요 — 로직 변경 없음)
- 이미지 에셋이 `public/assets/slc/` 경로에 존재하고 Next.js/Vite 정적 서빙 확인

### URL-action-result

- `/home?care=injection`에서 사용자가 홈을 열었을 때 새 주사일 배경 이미지가 적용된 카드 레이아웃을 볼 수 있다.
- `/home?care=clinic`에서 사용자가 홈을 열었을 때 새 병원 방문일 이미지와 sage 계열 비주얼이 보인다.
- `/home?care=waiting`에서 사용자가 홈을 열었을 때 lavender 계열 새 배경과 함께 조용한 체크리스트 화면이 보인다.
- `/home`에서 모바일(375px) viewport에서 텍스트와 카드가 이미지 배경 위에서도 가독성이 유지된다.
- 이미지가 없는 phase 혹은 이미지 로드 실패 시 기존 CSS 그라데이션 배경으로 폴백된다.

### 회귀 확인

- care-day 분기 동작이 변경 전후로 동일함을 `adaptive-home-runtime.tsx` 렌더 결과로 확인
- `data-phase`, `data-intensity`, `data-applied-rules` 등 테스트 셀렉터 속성 유지

---

## 작업 순서 권고

1. 이미지 파일 준비 → `public/assets/slc/` 배치
2. `slc-assets.ts` home 슬롯 업데이트
3. `care-surface-primitives.module.css` — phase CSS 토큰 재조정
4. `CareSurfaceFrame` — 배경 이미지 레이어 추가
5. `CompactHeroGreeting`, `MissionCardPair`, `QuickStatRow`, `QuietChecklist` CSS 미세 조정
6. `CarePhaseStrip` 비주얼 조정
7. 각 care-day 컴포넌트에서 필요 시 레이아웃 클래스 조정
8. 모바일 viewport 스모크 테스트 (375px, 390px)
9. 타입체크 + 기존 테스트 통과 확인

---

## 연관 스펙

- `spec-dynamic-home.md` — care-day 분기 로직 (이 스펙에서 건드리지 않음)
- `spec-care-surface-engine.md` — 슬롯 구성 로직 (이 스펙에서 건드리지 않음)
