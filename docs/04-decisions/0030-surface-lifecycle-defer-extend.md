# ADR 0030 — Surface Lifecycle: defer adoption, extend ADR 0009 instead of a parallel registry

## Status

Accepted — 2026-05-30; carried forward from #456 on 2026-06-10

## Context

Surface Lifecycle 설계 문서가 제안되었다 (Trigger → Context → Decision → Widget → Action → Fallback 모델, 9개 Surface, 별도 위젯 레지스트리 `HeroTimeCard`/`CountdownArc`/`DosePill` 등, P0–P6 Surface-간 priority, `/src/surfaces/{types,registry,decision-engine,fallbacks}.ts` 신규 트리).

그러나 `care-surface-engine.ts` 는 이미 작동하는 decision engine 이다 — `config/care-surface-rules.json` 을 specificity-first 로 평가해 슬롯별 컴포넌트를 고른다. ADR 0009·0022 가 그 위에 박혀 있고, `CareSurfaceComponent` 열거형이 canonical 이다. 새 `/src/surfaces/` 트리는 이와 기능적으로 겹친다.

동시에 현재 MVP/demo readiness 작업은 실기기 Push QA, 캡처 fixture 확대, production smoke 처럼 이미 존재하는 care loop 검증에 더 높은 우선순위를 둔다.

## Decision

Surface Lifecycle 문서의 **별도 위젯 레지스트리와 `/src/surfaces/` 신규 트리를 거부**한다. 새 렌더링 체계를 만들지 않는다.

Surface Lifecycle 의 가치 있는 부분 — lifecycle state (`approaching`/`due_now`/`overdue`/`needs_review`), Surface-간 priority (P0–P6), fallback state 명시 — 은 **후속 라운드에 기존 `care-surface-engine.ts` 를 확장해 흡수**한다. 교체가 아니라 확장이다. 위젯 레지스트리는 ADR 0009 의 `CareSurfaceComponent` 를 canonical 로 유지한다.

이 결정은 Concern triage 수용 여부와 독립적으로 적용된다. Concern triage 는 현재 Proposed 상태(ADR 0032)이며, 그 표면이 나중에 수용되더라도 새 `/src/surfaces/` 병렬 트리를 만들지 않고 기존 `care-surface-engine.ts`/ADR 0009 위에 얹어야 한다.

## Considered Options

- **전면 교체 (`/src/surfaces/` 신규 트리로 `care-surface-engine.ts` 대체)** — 병렬 렌더 체계 두 개가 공존해 어느 쪽이 canonical 인지 코드베이스가 혼란스러워진다. repo guidance 의 boring infrastructure / surgical changes 원칙에도 맞지 않는다.
- **이번 라운드에 확장까지 동시 진행** — 새 surface 논의와 렌더링 엔진 변경을 동시에 하면 리스크가 두 배가 되고 demo readiness 가 멀어진다.

## Consequences

### Easier

- 단일 canonical 렌더 체계 유지 — `care-surface-engine.ts` + ADR 0009 슬롯/컴포넌트.
- Proposed Concern triage(ADR 0032) 같은 후속 표면도 수용된다면 `computeCareSurface` 결과를 재사용해야 한다는 경계가 명확해진다.
- demo-critical Push QA, capture fixture, production smoke 같은 기존 care loop 검증에 집중 가능.

### Harder

- Surface Lifecycle 문서를 본 기여자가 `/src/surfaces/` 를 기대했다가 없음을 발견할 수 있다 — 본 ADR 이 그 부재의 이유다.
- lifecycle state / Surface-간 priority 의 가치는 후속 확장 전까지 미실현 상태로 남는다.

## Related

- ADR 0009 — state-driven generative UI (확장 대상, canonical 위젯 레지스트리)
- ADR 0022 — brief execution priority renderer
- ADR 0032 — Concern triage architecture (Proposed; future surfaces still inherit this ADR 0030 boundary)
- `docs/01-product/mvp-target.md` — current MVP/demo readiness constraints
