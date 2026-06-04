# Autonomous Routine Assignment

## Purpose

Define the recurring routine for checking project status and recommending the next concrete engineering move.

## Schedule

Run daily at 9:00 AM.

## Repository

`C:\Users\user\claude-project\ai-business-group10`

## Routine

1. Check git status, recent commits, and local branch state.
2. Check open GitHub issues and pull requests.
3. Identify updates since yesterday.
4. Review the Home storyline / care-state hero epic.
5. Review notification-related work.
6. Review navigation and IA work.
7. Check for failing tests, CI failures, deployment risks, or unverified acceptance criteria.
8. Produce a concise status report.

## Report Format

### 1. Changes since yesterday

Summarize issue, PR, commit, CI, and deployment changes. Include issue or PR numbers when available.

### 2. Top 3 priorities for today

Pick the three moves most likely to advance the core care loop or remove a known Red.

### 3. Blockers or questions

Call out missing credentials, remote migration gaps, unclear acceptance criteria, failing checks, or owner decisions.

### 4. Suggested next commit or PR

Name the next small vertical slice. Prefer one that can be verified with tests and URL-action-result evidence.

## Evidence Discipline

Do not describe a product behavior as complete unless the relevant verification has actually run or the deployment gap is clearly stated.

