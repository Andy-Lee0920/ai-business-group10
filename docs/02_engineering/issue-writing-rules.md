# Issue Writing Rules — Fevio [페비오]

## Purpose

Issues in this repository must be understandable to both developers and non-developer contributors using Claude Code, Codex, or similar coding agents.

An issue should answer:

1. What user-visible result are we trying to create?
2. Why does it matter for the SLC loop?
3. What can a contributor safely ask an agent to do?
4. How will we know it is done?

## Title grammar

Use Korean-first, user-result-first titles.

```text
[P0/P1] <단계명> — <사용자가 이해할 결과> (<짧은 기술 앵커>)
```

Examples:

```text
[P0] 준비 0 — Vercel에서 열리는 웹앱 뼈대 만들기 (Next.js/Supabase)
[P0] 진입 1 — 구글 로그인 후 개인정보 동의까지 끝내기 (Auth/Privacy)
[P0] 기록 2 — 병원 메모를 오늘 할 일 카드로 확정하기 (Capture/Confirm)
```

Avoid titles that are only developer jargon:

```text
Bad: CareActionCard model + computeCareDay
Good: 오늘 상황에 맞는 홈 화면 판단 규칙 만들기 (Care Day/Card Model)
```

## Body grammar

Every implementation issue should use these sections.

### 1. 한 줄 목표

A single sentence in everyday language.

### 2. 사용자가 보게 될 변화

Describe the visible experience: screen, button, message, URL, or database outcome that matters.

### 3. 왜 필요한가

Explain how this advances the SLC flow or reduces risk.

### 4. 이번 이슈에서 할 일

Bullet list of concrete work.

### 5. 이번 이슈에서 하지 않을 일

Prevent scope creep.

### 6. Claude Code/Codex로 기여하는 방법

Tell contributors exactly what they can ask an agent to do, for example:

```text
"이 이슈와 SLC target을 읽고, 먼저 실패하는 테스트 하나를 작성한 뒤 최소 구현으로 통과시켜줘."
```

Include contribution lanes:

- 문서/카피
- UI/디자인 토큰
- 테스트
- DB/RLS
- 구현
- 리뷰

### 7. TDD 시작점

Name the first red test or smoke check.

### 8. 완료 기준

Use checkboxes. Completion evidence should be observable.

### 9. 개발 메모

Put technical names here: table names, routes, functions, env vars, commands.

### 10. 연결 문서

Link SLC, PRD, specs, design deck, and related issues.

## Language rules

Prefer 2026 everyday Korean product language:

- Vercel 미리보기 URL
- 구글 로그인
- 개인정보/의료 경계 동의
- 병원 메모
- 오늘 할 일 카드
- 파트너에게 공유
- 카카오톡 링크
- 확인했어요
- 다시 물어볼게요
- 앱처럼 보이는 모바일 웹

Technical words are allowed, but always pair them with an everyday explanation.

```text
Good: Supabase RLS — 다른 커플의 데이터가 절대 보이지 않게 막는 DB 권한 규칙
Bad: RLS policies and grants
```


## Red issue closure rule

Red가 남아 있으면 이슈를 닫지 않는다.

Red는 아래를 포함한다.

- 실패하는 테스트
- 실패하는 Vercel/GitHub check
- 재현 가능한 deployment error
- 권한 있는 사람이 처리해야 하는 외부 설정
- 아직 증거가 없는 완료 기준

진행 방식:

1. 부모 이슈에 Red evidence를 남긴다.
2. Red를 Green으로 넘기는 child issue를 만든다.
3. child issue에 완료 기준을 하나의 관찰 가능한 Green으로 적는다.
4. child issue가 Green evidence로 닫히기 전까지 부모 이슈는 닫지 않는다.
5. 부모 이슈는 연결된 child Red가 모두 Green이거나 명시적으로 out of scope가 되었을 때만 닫는다.

이 규칙은 코드 TDD뿐 아니라 configuration TDD에도 적용한다.

```text
Red: Vercel log says Root Directory "old-app-root" does not exist.
Child: Vercel Project Settings에서 Root Directory를 empty/default로 바꾼다.
Green: 새 deployment가 repo root package.json을 기준으로 build를 시작한다.
```

## Agent-use rules

When asking Claude Code/Codex to work on an issue:

1. Paste or reference the issue URL.
2. Tell the agent to read `docs/01_product_requirements/SLC target/SLC target.md`.
3. Tell the agent which TDD cycle to start with.
4. Ask it to avoid P1/OpenRouter unless the issue is #28.
5. Ask it to report tests run and files changed.

Suggested prompt:

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01_product_requirements/SLC target/SLC target.md 와 관련 spec을 먼저 읽고,
TDD로 red → green → refactor 순서로 진행해.
이번 PR에서는 이슈 범위 밖 작업과 P1 OpenRouter는 하지 마.
완료 시 변경 파일, 테스트 결과, 남은 리스크를 보고해.
```

## Review rules

A reviewer should be able to answer:

- Is the issue still inside the SLC scope?
- Is the user-visible outcome clear?
- Is there one TDD starting point?
- Are non-goals explicit?
- Are secrets/privacy/medical boundaries preserved?
- Can a non-developer understand what changed?
