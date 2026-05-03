---

name: specctl

# 설명은 Claude가 이 스킬을 언제 써야 하는지 판단하는 데 가장 중요합니다.

description: Enforce a spec-first development workflow with specctl. Use when the user asks to create, review, submit, or implement a feature spec, especially in projects using docs/specs, spec.md, specctl, spec/* branches, or spec-first PRs.
disable-model-invocation: true
argument-hint: "[feature-name | spec-file | request]"
-----------------------------------------------------

# specctl Skill

This skill turns Claude Code into a spec-first development assistant that works with the `specctl` CLI.

`specctl` is the source of truth for repository workflow commands. This skill is the behavioral guardrail for Claude: it makes Claude read specs first, avoid implementation drift, protect spec-only branches, and validate work against the spec before changing code.

## Core principle

Do not implement product code first.

For any feature, behavior change, AI behavior change, UX change, or validation-related request:

1. Find or create the relevant spec.
2. Read the spec.
3. Check whether the spec is complete.
4. Respect P0/P1/P2 priority boundaries.
5. Respect `Not Building` as a hard exclusion list.
6. Only implement after the spec is clear enough.
7. Validate the implementation against `Validation Plan` and `Demo Acceptance Criteria`.

## When to use

Use this skill when the user asks for any of these:

* Create a new feature spec.
* Review an existing spec.
* Implement a feature from a spec.
* Check whether implementation matches a spec.
* Submit a spec PR.
* Notify reviewers for spec review.
* Enforce spec-only branch rules.
* Work inside a repository that uses `specctl`, `docs/specs`, or `spec/*` branches.

## Safety rule

This skill may lead to Git operations, PR creation, reviewer notifications, or email notification commands.

Because of that, do not run commands that commit, push, create PRs, or send notifications unless the user explicitly asks for that action.

Safe commands without extra confirmation:

```bash
specctl --help
specctl ci-check --base origin/main
git status
git diff --name-only
git branch --show-current
```

Commands that require explicit user intent:

```bash
specctl start <feature-name>
specctl submit <spec-file>
specctl submit <spec-file> --notify
specctl submit <spec-file> --notify --email
specctl notify <spec-file>
specctl notify <spec-file> --email
git add
git commit
git push
gh pr create
```

## Initial repository check

Before doing spec work, inspect the repository state:

```bash
git status --short
git branch --show-current
find . -maxdepth 3 -type f \( -path "./docs/specs/*.md" -o -name "spec.md" -o -name "SPEC.md" -o -path "./.specctl/team.yml" \) 2>/dev/null
```

Then check whether `specctl` is available:

```bash
specctl --help
```

If `specctl` is missing, tell the user to install it:

```bash
pipx install git+https://github.com/Andy-Lee0920/specctl.git
```

Do not pretend `specctl` ran if it is not installed.

## Available specctl commands

Use these commands according to intent:

### Initialize repository workflow

Use when the project does not yet have `.specctl/team.yml` or `docs/specs/`.

```bash
specctl init
```

Expected effect:

* Creates `.specctl/team.yml` if missing.
* Creates `email-notification-setting.md` if missing.
* Ensures `docs/specs/` exists.

### Start a new spec

Use when the user asks to start a new feature spec.

```bash
specctl start <feature-name>
```

Expected effect:

* Switches to `main`.
* Pulls `origin/main`.
* Creates a new `spec/<feature-name>` branch.
* Creates `docs/specs/<feature-name>.md` from the template.

After running, stop and ask the user to edit or review the generated spec unless they already asked Claude to draft the contents.

### Submit a spec PR

Use only when the user explicitly asks to submit/open a spec PR.

```bash
specctl submit <spec-file>
```

Optional reviewer notification:

```bash
specctl submit <spec-file> --notify
```

Optional email notification:

```bash
specctl submit <spec-file> --notify --email
```

Before submit, always inspect changed files:

```bash
git diff --name-only HEAD
```

If any changed file is outside `docs/specs/`, stop. A spec-only PR must only change files under `docs/specs/`.

### Notify reviewers again

Use only when the user explicitly asks to notify reviewers on an existing PR.

```bash
specctl notify <spec-file>
```

With email:

```bash
specctl notify <spec-file> --email
```

### CI branch guardrail

Use to check whether a `spec/*` branch only changed spec files:

```bash
specctl ci-check --base origin/main
```

## Spec discovery

When the user gives a spec file path, use it.

Otherwise, search in this order:

1. `docs/specs/<feature-name>.md`
2. Any relevant `docs/specs/*.md`
3. `spec.md`
4. `SPEC.md`
5. Template or generated spec files only as fallback

If multiple specs are plausible, choose the most relevant one by filename and content. If still ambiguous, report the candidates and proceed with the most likely one rather than blocking unnecessarily.

## Manual spec completeness check

The current `specctl` repository contains a section checker in code, but it may not be active in the CLI. Therefore Claude must manually check the spec content before implementation or submission.

A complete spec should include these markdown sections:

```text
## Target User
## Problem
## P0
## P1
## P2
## Not Building
## User Flow
## AI Behavior
## Validation Plan
## Demo Acceptance Criteria
```

The `## AI Behavior` section should include the following concepts:

```text
model
input
output
failure or fallback
```

If any required section is missing, stop implementation and report exactly what is missing.

If the spec is present but vague, do not invent major requirements. Make the smallest reasonable improvement to the spec or ask for the missing product decision, depending on the user's request.

## Spec review checklist

When reviewing a spec, check:

1. Target user is specific enough.
2. Problem is concrete and user-facing.
3. P0 is minimal and shippable.
4. P1 is useful but not required for first demo.
5. P2 is clearly optional.
6. `Not Building` prevents scope creep.
7. User flow is testable as a sequence.
8. AI behavior has model, input, output, and failure/fallback.
9. Validation plan can be executed by a real user or test.
10. Demo acceptance criteria are observable.

Return review feedback in priority order.

## Implementation rules

Before editing implementation files:

1. Read the relevant spec.
2. Summarize P0/P1/P2 and `Not Building`.
3. Identify files likely to change.
4. Implement P0 first.
5. Implement P1 only if it is clearly needed or explicitly requested.
6. Do not implement P2 unless the user explicitly asks.
7. Do not implement anything listed under `Not Building`.
8. Add or update tests from `Validation Plan`.
9. Verify against `Demo Acceptance Criteria`.

## Branch rules

Check the current branch:

```bash
git branch --show-current
```

If the branch starts with `spec/`:

* Treat it as a spec-only branch.
* Do not edit product code.
* Only edit files under `docs/specs/`.
* If implementation is requested, explain that implementation should happen on a separate implementation branch after spec review.

If the branch does not start with `spec/`:

* Implementation is allowed only after reading and validating the relevant spec.

## Output format for spec review

Use this format:

```md
## Spec review

- Spec file:
- Overall status: Pass / Needs revision / Blocked

## Missing or weak items

1.
2.
3.

## Scope check

- P0:
- P1:
- P2:
- Not Building:

## AI behavior check

- Model:
- Input:
- Output:
- Failure/fallback:

## Validation check

- Validation Plan:
- Demo Acceptance Criteria:

## Recommended next action

One clear next step.
```

## Output format before implementation

Use this format before editing code:

```md
## Spec confirmed

- Spec file:
- Branch:
- P0 scope:
- Excluded by Not Building:

## Implementation plan

1.
2.
3.

## Validation plan

- Commands/tests to run:
- Demo acceptance criteria to verify:
```

## Output format after implementation

Use this format:

```md
## Changes made

- Files changed:
- Behavior changed:

## Spec alignment

- P0 satisfied:
- P1 satisfied:
- P2 intentionally skipped:
- Not Building respected:

## Verification

- Commands run:
- Result:

## Remaining risks

-
```

## Common workflows

### Workflow A: New feature spec

1. Run repository check.
2. Run `specctl init` only if the repository is not initialized and the user asked to initialize.
3. Run `specctl start <feature-name>` only if the user asked to create/start a spec.
4. Draft or edit `docs/specs/<feature-name>.md`.
5. Manually check required sections.
6. Stop before submit unless the user explicitly asked to submit.

### Workflow B: Review existing spec

1. Find the spec.
2. Read it.
3. Manually check required sections.
4. Review against the checklist.
5. Suggest concrete edits.

### Workflow C: Implement from spec

1. Find the spec.
2. Confirm current branch is not `spec/*`.
3. Read and check the spec.
4. Summarize P0/P1/P2 and Not Building.
5. Implement only allowed scope.
6. Run tests/checks from Validation Plan.
7. Report spec alignment.

### Workflow D: Submit spec PR

1. Confirm user explicitly asked to submit.
2. Check current branch.
3. Check changed files.
4. Stop if any changed file is outside `docs/specs/`.
5. Run `specctl submit <spec-file>`.
6. Add `--notify` or `--email` only if the user explicitly requested it.

## Do not do

* Do not implement code before reading the spec.
* Do not edit product code on `spec/*` branches.
* Do not expand scope beyond P0/P1 without permission.
* Do not implement anything under `Not Building`.
* Do not run commit, push, PR, notify, or email commands without explicit user intent.
* Do not claim the spec passed if required sections were not checked.
* Do not rely only on the CLI if the CLI checker is unavailable or inactive.
