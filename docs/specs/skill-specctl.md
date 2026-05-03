# Spec: skill-specctl

## Target User

AI-assisted 개발 워크플로우를 사용하는 소프트웨어 개발자.
`specctl` CLI와 `docs/specs/` 기반의 스펙 주도(spec-first) 개발을 팀 내에서 운영하는 개발자.

## Problem

Claude는 기본적으로 사용자가 요청하면 바로 코드를 구현하려 한다. 스펙이 불완전하거나 없어도 추측으로 구현을 시작한다. 이로 인해 범위 초과(scope creep), 구현 표류(implementation drift), 스펙과 코드 불일치가 발생한다.
또한 `spec/*` 브랜치에서 실수로 제품 코드를 수정하는 사고도 생긴다.

## 핵심 기능 (Scope)

## P0

- Claude가 구현 요청 시 해당 스펙 파일을 먼저 찾아 읽는다.
- 스펙 필수 섹션(`## Target User`, `## Problem`, `## P0`, `## P1`, `## P2`, `## Not Building`, `## User Flow`, `## AI Behavior`, `## Validation Plan`, `## Demo Acceptance Criteria`) 존재 여부를 수동으로 확인한다.
- 섹션이 누락되면 구현을 중단하고 누락 항목을 정확히 보고한다.
- `spec/*` 브랜치에서는 `docs/specs/` 외부 파일을 절대 편집하지 않는다.
- P0만 구현하고, P2와 `Not Building` 항목은 절대 구현하지 않는다.
- `specctl` 미설치 시 설치 안내를 제공하며 실행된 척하지 않는다.

## P1

- 스펙 리뷰 결과를 정해진 마크다운 형식으로 출력한다.
- 구현 전/후 정해진 형식의 요약을 출력한다.
- `specctl submit`, `specctl notify` 실행 전 사용자의 명시적 확인을 요구한다.

## P2

- `specctl ci-check`로 CI 환경에서 브랜치 파일 범위를 자동 검사한다.
- 여러 스펙 파일이 후보일 때 자동으로 가장 관련성 높은 파일을 선택한다.

## Not Building

- `specctl` CLI 자체를 대체하거나 재구현하지 않는다.
- 스펙 없이 제품 요구사항을 Claude가 자체적으로 만들어내지 않는다.
- 사용자가 명시적으로 요청하지 않은 커밋, 푸시, PR 생성, 알림 발송을 수행하지 않는다.
- `spec/*` 브랜치에서 구현 작업을 하지 않는다.

## 유저 경험 (UX & AI)

## User Flow

1. 사용자가 기능 구현을 요청한다.
2. Claude가 현재 브랜치를 확인한다. `spec/*`이면 스펙 편집 모드로 전환하고 구현을 거부한다.
3. Claude가 `docs/specs/<feature>.md`를 찾아 읽는다.
4. 스펙의 필수 섹션을 수동으로 체크한다. 누락 시 정확한 목록을 보고하고 중단한다.
5. P0/P1/P2/Not Building을 요약하고 구현 계획을 제시한다.
6. P0 범위만 구현한다.
7. `Validation Plan`의 테스트/명령을 실행한다.
8. `Demo Acceptance Criteria` 달성 여부를 보고한다.

## AI Behavior

- **Model**: claude-sonnet-4-6 (Claude Code 기본 모델)
- **Input**: 사용자 요청 + 현재 브랜치 + `docs/specs/<feature>.md` 내용 + `git status`
- **Output**: 스펙 리뷰 결과 또는 구현 전/후 형식화된 마크다운 보고서
- **Failure / Fallback**:
  - 스펙 파일이 없으면 `specctl start <feature>`를 안내하고 구현하지 않는다.
  - 필수 섹션 누락 시 누락 목록을 출력하고 구현을 중단한다.
  - `specctl` CLI 미설치 시 설치 명령을 안내하고 실행된 척하지 않는다.
  - `spec/*` 브랜치에서 제품 코드 편집 요청 시 거부하고 이유를 설명한다.

## 데모 합격 기준 (Success)

## Demo Acceptance Criteria

- `spec/*` 브랜치에서 제품 코드 편집 요청 시 Claude가 거부하고 이유를 설명한다.
- 필수 섹션이 누락된 스펙에 대해 Claude가 정확히 어떤 섹션이 없는지 보고한다.
- 완전한 스펙이 있을 때 Claude가 P0만 구현하고 P2/Not Building을 건너뛴다.
- `specctl submit` 등 위험 명령은 사용자가 명시적으로 요청할 때만 실행된다.
- 스펙 리뷰 출력이 정해진 마크다운 형식을 따른다.

## 확인 사항 (Validation)

## Validation Plan

- `spec/*` 브랜치에서 "파일 X를 편집해줘" 요청 → Claude가 거부하는지 확인한다.
- 섹션이 2개 누락된 스펙 파일을 주고 리뷰 요청 → 누락 섹션 목록이 정확한지 확인한다.
- 완전한 스펙을 주고 구현 요청 → P0만 구현하고 P2는 건너뛰는지 확인한다.
- `specctl` 미설치 환경에서 submit 요청 → 설치 안내를 출력하고 실행 안 함을 확인한다.
- 스펙 리뷰 출력 형식이 `## Spec review` 헤더와 하위 섹션을 포함하는지 확인한다.
