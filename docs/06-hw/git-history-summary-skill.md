# Git History Summary Skill

## Purpose

This skill helps an AI agent summarize daily Git history for the Fevio team repository.

The goal is not to list every changed file mechanically. The goal is to explain what changed, why it matters for Fevio, and what the team should check next.

## When to Use

Use this skill once per day, or whenever the team wants to understand recent repository changes.

Git history analysis targets the **main branch only**. Do not analyze feature branches or open PRs unless explicitly instructed.

## Branch Workflow

Before running the daily task:

1. Pull the latest `main` branch.
2. Create a new branch from `main` (e.g. `docs/git-history-YYYY-MM-DD`).
3. Run the analysis and write the digest on that branch.
4. Commit the digest files on that branch.
5. Merge locally into `main` and push:

```bash
git checkout main
git pull origin main
git merge docs/git-history-YYYY-MM-DD
git push origin main
```

If `main` has branch protection rules that block direct push, fall back to opening a pull request targeting `main` instead.

## Inputs

The agent may read:

- git log
- git diff --stat
- changed file paths
- commit messages
- README.md
- AGENTS.md
- docs/
- GitHub issues, if read-only access is available

## Allowed Actions

The agent may:

- Read git history
- Read changed files
- Summarize commits
- Group changes by product area
- Write a daily digest under docs/06-hw/daily-git-history/
- Add follow-up items to docs/06-hw/daily-git-history/git-history-TODOS.md

## Forbidden Actions

The agent must not:

- Edit application code
- Edit database migrations
- Deploy the app
- Close GitHub issues
- Merge pull requests
- Send emails
- Delete files
- Modify secrets or environment variables

## Fevio-Specific Interpretation Rules

When summarizing changes, classify them into these categories:

1. Product behavior
2. UX or copy
3. Partner sharing and privacy
4. Medical-safety boundary
5. Data model or Supabase
6. Auth, RLS, or security
7. Tests and verification
8. Documentation or project management

## Output Format

Each daily summary should include:

1. Date range analyzed
2. Commit count
3. Top changes
4. Changed files grouped by area
5. Product meaning for Fevio
6. Risks or things to verify
7. Suggested next actions
8. Whether the loop reached its exit condition

## Exit Condition

The loop is complete only when:

- The analyzed date range is written
- Commit count is written
- Important changed files are grouped by area
- At least three meaningful changes are summarized, unless there were fewer than three commits
- At least one risk or verification item is written
- The output is saved as a dated daily digest

If there were no commits, the agent should still write a short "no changes" digest.
