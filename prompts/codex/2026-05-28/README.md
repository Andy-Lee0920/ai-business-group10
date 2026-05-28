# Fevio Codex Overnight Batch — 2026-05-28

Drafted by Opus (grilling + issue design + prompt authoring). Implementation = Codex.

## 슬라이스 목록

| # | Slice | GitHub Issue | ADR 생성 |
|---|------|------------|---------|
| 1 | PWA infra closure (inline CTA + iOS stub) | [#421](https://github.com/Andy-Lee0920/ai-business-group10/issues/421) | 0026 |
| 2 | pg_cron + reminder_dispatches UNIQUE | [#422](https://github.com/Andy-Lee0920/ai-business-group10/issues/422) | — |
| 4a | split_candidates offset + mustInlineQuote 도메인 | [#423](https://github.com/Andy-Lee0920/ai-business-group10/issues/423) | 0029 |
| 3 | Push 발송 실패 처리 + 재구독 CTA | [#424](https://github.com/Andy-Lee0920/ai-business-group10/issues/424) | 0028 |
| 4b | Confirm UI side-by-side rendering | [#425](https://github.com/Andy-Lee0920/ai-business-group10/issues/425) | — |

## 의존성 그래프

```
#421 (Slice 1) ──┬──► #424 (Slice 3)
#422 (Slice 2) ──┘
#423 (Slice 4a) ──► #425 (Slice 4b)
```

## 오버나잇 배치 실행 순서

### 1단계 — 병렬 가능 (독립 슬라이스 3건)
세 개의 분리된 Codex 세션을 동시에 시작:

```bash
cd /Users/reliqbit_mac/projects/Fevio/Fertility-support/ai-business-group10

# Terminal A
codex exec --full-auto < prompts/codex/2026-05-28/slice-1-pwa-infra-codex.md

# Terminal B
codex exec --full-auto < prompts/codex/2026-05-28/slice-2-pg-cron-codex.md

# Terminal C
codex exec --full-auto < prompts/codex/2026-05-28/slice-4a-offset-domain-codex.md
```

### 2단계 — 1단계 PR 머지 후 (의존 슬라이스 2건)

```bash
# 1단계 PR 머지 확인 후
git fetch origin && git checkout main && git pull

# Terminal D — #421 + #422 머지 후
codex exec --full-auto < prompts/codex/2026-05-28/slice-3-push-failure-codex.md

# Terminal E — #423 머지 후
codex exec --full-auto < prompts/codex/2026-05-28/slice-4b-confirm-ui-codex.md
```

## 엄격 반복(Strict Iteration) 공통 규약

모든 프롬프트가 적용하는 공통 규약 요약 (각 프롬프트에 inline 반복):

1. **Assumption → Action → Verify → On Red diagnose → On Green commit** 사이클
2. **Max 3 edit attempts per file** — 3번째도 Red면 `blocker-note-S{step}.md` 작성 후 STOP
3. **Green 파일 재편집 금지** — 회귀 발견 시 해당 step으로 돌아가 1회 수정만
4. **타입 우회 금지**: `any`, `Record<string, unknown>`, `// @ts-ignore`, `// @ts-expect-error` 모두 금지
5. **테스트 skip 금지**: `it.skip`, `xit`, `it.todo` 금지
6. **Git 규약**: `--amend` 금지 (새 commit), `--no-verify` 금지, Conventional Commits
7. **Issue close 금지** — Codex는 PR 생성과 comment까지만. close는 사람이 결정
8. **Stop condition 발견 시**: blocker-note 작성 + child issue 분리 제안 + 현재 step에서 종료

## Codex 세션 모니터링 체크리스트

- [ ] 각 세션이 본인 branch 생성 후 작업하는가 (cross-branch 오염 방지)
- [ ] PR 생성 시 base = main (다른 PR의 branch가 아님)
- [ ] 머지 전 audit-report-{N}.md 삭제됨
- [ ] ADR이 docs/04-decisions/에 정착됨
- [ ] Issue comment에 evidence + PR 링크 포함

## Hand-off 형식 (각 PR 공통)

- Title: `feat(scope): #N closure — short why`
- Body 섹션:
  - Summary (1-3 bullet)
  - URL-action-result evidence (스크린샷 또는 로그)
  - Audit summary (Slice 1, 2의 경우)
  - Test evidence (typecheck + vitest + e2e exit 0)
  - Schema diff (migration 있는 경우)
  - ADR link (해당 시)
  - Anti-patterns guarded (회귀 가드 설명)

## Opus 검증 단계 (인간 + Opus 분담)

- **Opus**: 각 PR diff를 읽고 acceptance criteria 체크리스트 검증, ADR 본문 적절성 평가
- **인간(사용자)**: 모바일 viewport 스크린샷 시각 검토, Vercel Preview 직접 클릭, 의약품 안전 영역 최종 결재

## ADR 후보 4건 — 정착 위치

| ADR | 정착 슬라이스 | 트리거 |
|-----|------------|------|
| 0026 — Push permission UI trigger = inline CTA | Slice 1 (#421) | grill D1 |
| 0028 — Push delivery failure policy | Slice 3 (#424) | grill D4 |
| 0029 — Confirm UI mandatory-inline-quote rule | Slice 4a (#423) | grill D6 |
| 0027 — iOS PWA install slice 분리 | 별도 child issue (Slice 1 STOP CONDITION 발동 시) | grill D2 |

## 참고 파일

- 본 디렉토리의 `slice-{N}-{name}-issue.md` = GitHub issue body 원본
- 본 디렉토리의 `slice-{N}-{name}-codex.md` = Codex CLI 프롬프트 (엄격 반복 포함)
