# AI-Assisted Development Logs & Transparency Process

This directory serves as the repository for documenting AI-assisted coding activities, model invocations, and session histories. Fevio mandates transparency in AI usage to ensure auditability, safety invariants compliance, and clear handoffs between humans and autonomous agents.

---

## 1. Transparency Guidelines

When using an AI assistant (such as Claude Code, Antigravity, or other LLM-based coding agents) to modify this repository, the agent or developer MUST:
1. **Document Invariants**: Record how safety and privacy invariants are protected during the session.
2. **Provide Verification Evidence**: Explicitly list all test commands run, test counts, and build verify outcomes.
3. **Trace Decisions**: Document what design alternatives were considered and rejected.
4. **Log Sessions**: Maintain a chronological record of changes in this directory.

---

## 2. Session Log Template

Every major AI-assisted task should append or create a log entry in this directory (e.g., `YYYY-MM-DD-task-name.md`) using the following template:

```markdown
# AI Session Log: [Short Task Title]

* **Date**: YYYY-MM-DD
* **AI Agent/Model**: [e.g., Gemini 3.5 Flash / Claude 3.7 Sonnet]
* **Target Issue/Epic**: #[Issue Number]
* **Branch**: [branch-name]

## 1. Goal & Context
[Describe the objective of the session and the parent ticket context.]

## 2. Protected Invariants & Safety Measures
- **Confirmation-first**: [How is confirmation-first preserved?]
- **Privacy Bounds**: [How is patient-private data isolated?]
- **Medical Advice Avoidance**: [Verify that no medical judgment was introduced.]

## 3. Decisions & Rationale
* **Decision**: [e.g., Extracting the shared care-action writer to src/lib/...]
  * *Rationale*: Avoid creating parallel write paths.
* **Rejected Alternative**: [What was rejected and why?]

## 4. Files Modified
* `path/to/modified-file.ts`: [Short explanation of change]
* `path/to/test-file.test.ts`: [New regression tests added]

## 5. Verification & Testing Evidence
* **Exact Command**: `npm run test -- path/to/modified-file.test.ts`
* **Result**: `N passed (N total)`
* **Typecheck Status**: `npm run typecheck` passed (exit code 0).
* **Build Status**: `npm run build` passed.

## 6. Out of Scope & Follow-ups
[List any items deferred to subsequent slices or human review.]
```

---

## 3. Reference Log of Past AI Sessions

A chronological index of historical AI-assisted sessions is maintained below for quick reference:

| Date | Session / Ticket | Primary Goal | Log File |
|---|---|---|---|
| 2026-06-08 | #440 Slice 0 | Extract shared canonical care-action writer | `2026-06-08-slice-0-care-action-writer.md` |
| 2026-06-08 | Repo Restructure | Root structure organization and specs clean-up | (Direct root README update) |
