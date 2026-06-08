# AI contribution logs

Fevio accepts AI-assisted contributions only when a human contributor remains accountable for scope, correctness, safety, and verification.

Use this folder for short review logs when AI materially helped produce a PR, design note, test plan, or code change. These logs are not a substitute for tests, code review, or product acceptance evidence.

## When to add a log

Add an entry when AI assistance materially affected any of the following:

- app code or tests;
- schema, RLS, auth, partner privacy, or service-role behavior;
- product/safety copy or UX decisions;
- repository docs intended to guide future contributors.

A log is optional for typo fixes, formatting-only edits, and mechanical command output that did not shape the decision.

## Entry format

Create one Markdown file per PR or work session:

```text
docs/ai-logs/YYYY-MM-DD-pr-NNN-short-title.md
```

Use this template:

```markdown
# AI contribution log — PR #NNN

Date: YYYY-MM-DD
Human owner: <name or GitHub handle>
Scope: <short summary>

## AI-assisted work

- <what the assistant helped draft, inspect, or verify>

## Human verification

- <commands run, review performed, or evidence checked>
- <what was accepted, edited, or rejected by the human>

## Safety/privacy review

- Patient/primary-user impact: <none / summary>
- Partner privacy impact: <none / summary>
- Raw clinical text exposure risk: <none / summary>
- Schema/RLS/service-role impact: <none / summary>

## Known gaps

- <remaining manual checks, deploy gaps, or owner decisions>
```

## Rules

- Do not paste secrets, raw production data, private health details, or private user identifiers into AI logs.
- Separate facts verified in the repo from assistant suggestions or assumptions.
- If a PR changes product behavior, link the relevant GitHub issue and acceptance evidence instead of treating this log as acceptance.
- Keep logs concise. The goal is traceability, not a transcript dump.
