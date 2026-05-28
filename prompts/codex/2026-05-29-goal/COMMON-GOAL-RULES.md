# Common Codex Goal Rules — Fevio overnight slices

Use this file with exactly one slice prompt in a dedicated clean worktree.

## Goal-mode bootstrap

1. Run `get_goal` if the tool exists.
2. If no active goal exists, call `create_goal` with the slice objective from the prompt. Do not set a token budget unless the human supplied one explicitly.
3. If the active goal exactly matches this slice, continue.
4. If a different active goal exists, stop before editing and write `blocker-note-goal-active.md` with the active goal summary and the intended slice.
5. Never call `update_goal({status:"complete"})` until all completion gates below are green, the PR exists, and the GitHub issue has a hand-off comment.
6. Use `update_goal({status:"blocked"})` only when the same blocker has repeated for at least three consecutive goal turns and there is no meaningful safe recovery path.

If goal tools are unavailable, treat the objective block in the slice prompt as the durable goal contract and continue; do not invent a weaker contract.

## Clean-worktree preflight

Before touching code:

```bash
git status --short --branch
git rev-parse --show-toplevel
git branch --show-current
```

Required state:
- Current branch is the slice branch named in the prompt, or a clean branch can be created from `origin/main`.
- No unrelated modified or untracked files.
- If dirty, stop and write `blocker-note-preflight-dirty-worktree.md`; do not stash, delete, or absorb unrelated work.

## Strict iteration loop

For every step:

1. **Assumption** — state the local hypothesis and the files expected to change.
2. **Action** — make the smallest reversible edit.
3. **Verify** — run the smallest test/typecheck/query that proves the step.
4. **On Red** — diagnose from output, make one narrower fix, verify again.
5. **3-strike** — if the same file fails after three edits for the same step, write `blocker-note-S{step}.md`, stop that slice, and do not create a misleading PR.
6. **On Green** — commit only that step's related changes with a Conventional Commit that references the issue.

Green files are locked. Reopen them only for a proven regression, and only once for the owning step.

## Hard bans

- No `any`, `Record<string, unknown>`, `@ts-ignore`, or `@ts-expect-error` as an implementation escape hatch.
- No `it.skip`, `test.skip`, `xit`, or `it.todo`.
- No `git commit --amend`.
- No `--no-verify`.
- Do not close GitHub issues; Codex creates PRs and comments only.
- Do not weaken existing ADRs or safety/privacy constraints to pass tests.

## Completion gates

A slice is complete only after all are true:

- Acceptance criteria in the issue prompt are satisfied or explicitly documented as a deployment gap accepted by the issue prompt.
- `npm run typecheck` passes.
- `npm test` passes, unless the slice prompt requires an additional narrower/full command.
- Required e2e/migration/schema checks pass or have a precise blocker note.
- Temporary audit reports are removed before PR unless the slice explicitly says to keep them.
- `git diff --check` passes.
- PR is pushed against `main`.
- The GitHub issue receives a comment with PR URL, test evidence, and any deployment gaps.
- Final `git status --short --branch` has no accidental debug artifacts.

Only then may goal mode be marked complete.

## Final response / PR evidence format

Use this evidence block in the PR and issue comment:

```md
## Goal evidence
- Branch:
- PR:
- Issue:
- Acceptance:
- Verification:
  - `npm run typecheck`: exit 0
  - `npm test`: exit 0
  - extra:
- Migration / deployment gap:
- ADR:
- Anti-pattern guards:
- Remaining risk:
```
