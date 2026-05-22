# ADR 0022 — Brief × Execution priority renderer

## Status

Accepted — 2026-05-21

## Context

ADR 0021 이 Daily Brief 를 새 home surface 로 도입했다. 동시에 `mvp-target.md` 의 핵심 operation 가치 ("오늘 주사 시간·약 이름·주사 위치·준비물 명확 표시") 는 그대로 유지된다. 두 surface 가 home 안에서 어떻게 공존하는지가 정의되지 않으면 디자이너·구현자가 매 화면마다 임의 결정을 하게 된다.

기존 `app/(authed)/home` 은 care card 리스트 중심 layout 이었다. Brief 가 추가되면 위 / 아래 / hero / 전체 takeover 어느 것도 가능하다. 그러나 시간 임박 (T-60 / T-15 / overdue) 인 care card 가 있을 때 brief 가 hero 자리를 차지하고 있으면 사용자가 critical action 을 놓친다. 반대로 평상시 brief 가 아래에 있으면 retention pull 이 약해진다.

`fevio-product-north-star.md` L380-417 "North Star UX Rules" 의 핵심은 "설명보다 실행" 이지만, closed-beta 사용자 피드백은 "실행 동기를 만드는 것이 콘텐츠" 라는 신호를 준다. 이 둘은 *시간* 으로 갈라진다 — 평상시 = 콘텐츠, 임박시 = 실행.

## Decision

Home 은 단일 hero slot 위에 두 surface (Daily Brief, Execution Surface) 를 priority renderer 로 합성한다.

```text
hero_slot = pickHeroSurface(now, cards, brief)

if any card.scheduled_at - now <= 15min  → hero = ExecutionSurface(card)
elif any card.scheduled_at - now <= 60min → hero = ExecutionSurface(card, mode='approaching')
elif any card overdue (not completed)     → hero = ExecutionSurface(card, mode='overdue')
else                                       → hero = DailyBrief
```

밀려난 surface 는 hero 아래로 demoted (collapsed preview). 즉 둘 다 항상 보이되 우선순위만 시간으로 바뀐다.

첫 viewport 는 다음 두 컴포넌트로 고정된다:

1. **Brief one-liner row** (또는 Execution hero) — 압축된 한 줄.
2. **Execution preview card** (또는 Brief expanded summary) — 다음 일정 카드 1개.

`fevio-product-north-star.md` L131-148 의 "utility-only" 원칙은 *executable* surface 에 한정해 해석한다. Brief 는 retention surface 이므로 한 줄 안에서 정보 압축 (memory `feedback_information_density` 의 "3줄 이하 + primary action 1개") 을 지키는 한 허용된다.

## Override rules

ADR 0009 의 `overrideReason` + `proximityDays` 가 본 ADR 의 takeover trigger 와 합쳐진다. v1 미사용 정책을 다음 범위로 활성화한다:

| Trigger | overrideReason | proximityDays / proximityMinutes | hero |
|---|---|---|---|
| Trigger shot D-day | `trigger_shot` | proximityMinutes ≤ 60 | ExecutionSurface |
| Procedure time gate | `procedure_time_gate` | proximityMinutes ≤ 60 | ExecutionSurface |
| Any card T-15 / overdue | derived | proximityMinutes ≤ 15 | ExecutionSurface |
| Empty / no card today | none | n/a | DailyBrief |
| `careDay = waiting_day` 평상시 | none | n/a | DailyBrief (intensity 0.2) |

## Rules

1. **단일 hero slot**: home 첫 viewport 의 hero slot 은 한 시점에 한 surface 만 hero. 두 surface 가 동시에 hero 가 되는 경우 없음.

2. **Demoted preview 형태**: 밀려난 surface 는 사라지지 않는다.
   - Brief 가 demoted → "오늘의 한 줄" 만 한 행으로 압축, expand on tap.
   - Execution 이 demoted → 다음 일정 카드 1개를 preview row 로.

3. **첫 viewport 압축도**: hero + 1 demoted preview 가 첫 fold 안. 두 번째 fold 부터 stats row / checklist / partner connect bar 등 (ADR 0009 slot 정의 사용).

4. **Override transparency**: home DOM 에 `data-hero-surface`, `data-override-reason`, `data-proximity-minutes` attribute 노출 (developer-only). 사용자에게 rule ID 노출 금지.

5. **상태 전환 안정성**: 같은 page 안에서 hero surface 가 30초 안에 두 번 바뀌지 않는다 (debounce). proximity boundary crossing 시 사용자가 surface 가 깜빡거리는 경험 방지.

6. **Reduced motion**: surface 전환은 fade 없이 즉시 swap (또는 prefers-reduced-motion 존중). intensity 변화 (ADR 0009 의 `--fevio-surface-intensity`) 는 static CSS.

## Consequences

### Easier

- "오늘 무엇을 해야 하는가" 와 "내가 어디에 있는가" 두 질문이 한 home 에서 모두 답된다.
- 시간 임박 시 critical action 이 자동으로 hero — 사용자가 brief 에 매몰돼서 critical 을 놓치지 않는다.
- 평상시 retention hook 이 default — daily-open 동기 확보.
- ADR 0009 의 v1 미사용 `proximityDays` 정책이 자연 활성화.

### Harder

- `pickHeroSurface` 결정 로직이 pure function 으로 테스트 가능해야 함 (시간 mock 필요).
- 두 surface 의 visual transition 이 user-disorienting 하지 않도록 컴포넌트 alignment 필요.
- Override / proximity 케이스의 fixture 와 E2E test surface 증가.

### Prohibited

- Brief 와 Execution 을 한 hero 안에 합성 (hybrid hero) — 책임이 모호해지고 정보 압축도 무너짐.
- Brief 를 hero 에 둔 상태에서 execution card 를 hide (사라지게 함). demoted preview 로는 반드시 존재.
- Push notification 으로 brief 를 발송 (brief 는 pull 채널, push 는 execution 만; ADR 0004 채널 정책 유지).
- 사용자에게 rule ID / override reason 을 raw text 로 노출.

## Follow-up criteria for revisiting

1. T-60 / T-15 boundary 가 사용자 행동 데이터로 잘못 잡혔다고 드러나면 boundary 재조정 (ADR revise 가 아니라 config 변경 우선).
2. Brief 가 demoted 됐을 때 expand interaction 이 한 번도 안 쓰이면 demoted preview 형식 재설계.
3. 두 surface 합성 외에 third surface (예: partner connect bar) 도 hero 가 되어야 한다는 요구가 반복되면 hero slot 정책 확장 검토.

## Related

- ADR 0008 — milestone-first `phaseCareDay` (Brief input)
- ADR 0009 — State-driven Generative UI (slot, overrideReason, proximityDays, intensity)
- ADR 0011 — CycleEvent state machine
- ADR 0021 — Daily Brief LLM exploration / deterministic destination
- ADR 0023 — Partner Brief separate contract (partner home 은 본 ADR 의 priority renderer 와 별개)
- `CONTEXT.md` — Daily Brief, Execution Surface term
- `DESIGN.md` — Visual language / Information architecture
