# ADR 0018 — MVP supersedes SLC; freeze SLC terminology for new work

## Status

Accepted — 2026-05-20

## Context

기존 문서는 "SLC" (Smallest Lovable Cycle)를 작업 scope 단어로 사용했다. 시간이 지나면서 결정은 MVP 언어로 이동했지만 문서·이슈·리뷰에서 두 단어가 혼용된다. 이는 contributor가 SLC simplification을 근거로 원래 product pain (irregular clinic schedules, medication risk, couple asymmetry, emotional load, sensitive-data trust)을 다시 erase하는 회귀를 유발한다.

이 ADR은 단어 정책을 박아 SLC 회귀를 차단한다.

## Decision

**MVP가 SLC를 대체한다.** 신규 문서·ADR·이슈·코드 리뷰는 "MVP"를 active scope frame으로 사용한다. "SLC"는 신규 산출물에서 사용하지 않는다.

## Rules

1. **신규 ADR/이슈/스펙**: "SLC"라는 단어로 scope를 정의하지 않는다.
2. **`docs/01-product/slc-target.md`**: archive로 유지. 파일 상단에 deprecation 노트 추가, 현재 MVP source of truth(PRD/CLAUDE.md) 링크.
3. **`CLAUDE.md` source hierarchy**: `slc-target.md` 항목을 후속 commit으로 MVP doc으로 격상하거나 제거 — 본 ADR 머지 후 후속 PR.
4. **`CONTEXT.md` product invariants**: "SLC success is one vertical care loop" → **"MVP success is one vertical care loop"** 로 변경 (본 ADR 머지와 같은 변경에서 처리).
5. **Code/test/spec 내 SLC 식별자**: 즉시 일괄 rename 금지 — 단어 정책 변경이지 코드 refactor 트리거가 아님. 새 코드만 MVP 용어 사용. 기존 식별자는 자연 정리 시 함께 갱신.

## Consequences

### Easier
- 새 작업은 MVP 한 단어로 scope 설명 일관성 회복.
- "SLC-style simplification으로 이 기능 빼자" 식의 회귀 토론이 단어 부재로 차단.

### Harder
- 기존 `slc-target.md`를 참조하는 외부 링크/문서 정합성 정리 필요.
- 코드 식별자에 남아 있는 SLC 단어가 즉시 정리되지 않으므로 일시적 혼재 발생.

### Prohibited
- 새 feature를 "SLC-only"로 좁힘.
- "SLC-style 단순화"를 명목으로 원래 product pain을 약화하는 결정.

## Follow-up criteria for revisiting

본 ADR은 durable. 되돌리는 것은 SLC simplification trap의 재도입을 의미하므로 정당한 근거 없이 reverse하지 않는다.

## Related

- `docs/01-product/slc-target.md` — deprecated archive
- `docs/01-product/prd-v1.0.md` — current MVP source of truth
- `CONTEXT.md` — invariant 카피 변경
- ADR 0015 / 0016 / 0017 — 모두 MVP scope 위에 작성됨
