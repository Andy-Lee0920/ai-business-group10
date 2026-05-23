# Spec: 홈 히어로 레이아웃 폴리싱

## 목적

홈 화면 비주얼 리모델링(`spec-home-visual-remodel.md`) 이후 발견된 두 가지 UX 문제를 수정한다.

1. `quiet` phase(일정 없는 날) 디자인이 이미지·색상 계열에서 다른 phase와 이질감을 가짐
2. sheet header의 `DailyBrief compact` 영역이 HeroZone `CheerCard`와 역할·위치가 겹쳐 어색함

---

## 변경 1 — quiet phase 디자인 통일

### 문제

`resolveHeroVisual` default case(quiet / 쉬어가는 날)가 라벤더 색상 + `pregnancy_wait.png`를 사용해 다른 phase의 따뜻한 오렌지/세이지 계열과 시각적으로 단절됨.

### 변경 내용

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 배경 그라데이션 | `#DCDEFF → #E8E9FF` (라벤더) | `#FFE8CC → #FFF2E0` (앰버 오렌지) |
| sheet 배경 | `rgba(235, 236, 255, 0.96)` | `rgba(255, 244, 232, 0.96)` |
| 카드 그라데이션 | `#F4F5FF → #E8EBFF` | `#FFFAF5 → #FFF0E0` |
| accentColor | `#7B80D4` | `#E8894A` |
| accentLight | `#CDD0FF` | `#FFD8A8` |
| textAccent | `#2E207A` | `#7A3A00` |
| 이미지 에셋 | `slcAssets.home.empty` (pregnancy_wait.png) | `slcAssets.home.waiting` (implantation_wait.png) |

**색상 설계 원칙:**
- `overdue_backlog` / `missed`의 경고 코랄(`#FF6B4E`)과 구별되도록 밝고 따뜻한 앰버 오렌지(`#E8894A`) 사용
- `implantation_wait.png`는 이미 `clinic_tomorrow` phase에서도 사용 중 — 이미지 재사용으로 디자인 일관성 확보

### 변경 파일

- `src/features/today/today-screen.tsx` — `resolveHeroVisual` default case

---

## 변경 2 — sheet header 메시지 영역 정리

### 문제

`priority === "execution"` 상태에서 두 개의 텍스트 메시지 영역이 동시에 노출됨:

```
[HeroZone]
  CheerCard ← topEmoji + heroVisual.heading + cheer.sub  (응원 메시지)

[ActionSheet header]
  DailyBrief compact ← brief 텍스트 (dot + 한 줄 요약)  ← 역할 중복
  DayTabs
```

CheerCard가 contextual 메시지 역할을 이미 담당하고 있어, sheet header의 `DailyBrief compact`가 중복이자 어색한 위치에 놓임.

### 변경 내용

sheet header에서 `priority` 분기 제거:

```tsx
// 변경 전
{priority.heroSurface === "execution" ? (
  <DailyBrief line={dailyBrief} compact />
) : (
  <ExecutionPreview item={previewItem} onOpen={setActiveItem} />
)}

// 변경 후
<ExecutionPreview item={previewItem} onOpen={setActiveItem} />
```

- `DailyBrief compact`는 sheet header에서 제거
- `ExecutionPreview`는 `previewItem` 유무에 따라 자체적으로 null 반환 — priority 조건 불필요
- `CheerCard`가 brief/contextual 메시지 역할을 단독 담당

### 역할 분리 (변경 후)

| 영역 | 역할 |
|------|------|
| HeroZone — CheerCard | phase별 contextual 메시지 (daily brief 또는 phase heading + 응원 문구) |
| ActionSheet header — ExecutionPreview | 다음 실행 항목 바로가기 (있을 때만 표시) |
| ActionSheet header — DayTabs | 날짜 탭 |

### 변경 파일

- `src/features/today/today-screen.tsx` — sheet header 조건 분기 제거, `DailyBrief` import 제거

---

## 완료 기준

### 기술 검증

- `tsc --noEmit` 통과

### URL-action-result

- `/home` (quiet phase, 일정 없음)에서 사용자가 홈을 열었을 때 앰버 오렌지 배경 + `implantation_wait.png` 이미지가 보인다.
- `/home` (execution priority)에서 사용자가 홈을 열었을 때 CheerCard 아래 sheet header에 brief 텍스트가 중복 노출되지 않는다.
- `/home` (previewItem 있음)에서 ExecutionPreview 버튼이 sheet header에 단독으로 표시된다.

---

## 연관 스펙

- `spec-home-visual-remodel.md` — 홈 비주얼 리모델링 전체 범위
- `spec-dynamic-home.md` — care-day 분기 로직
