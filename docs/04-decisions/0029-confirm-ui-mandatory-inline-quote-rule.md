# ADR 0029 — Confirm UI mandatory inline quote rule

## Status

Accepted — 2026-05-28

## Context

Confirm UI will show the clinic memo source next to candidate actions. Some candidate types carry higher operational risk because the primary user may later execute them as medication or injection tasks. The rule that decides when source text must be shown inline needs to live in the domain layer so every renderer uses the same safety policy.

Split candidates remain review artifacts. The inline quote rule does not confirm medical truth, dosage, timing, or ownership. It only decides when the UI must keep the original clinic wording visible while the primary user reviews the candidate.

## Options Compared

| Option | Rule | Pros | Cons |
|---|---|---|---|
| A. `suggestedCardType` only | Require quote for every injection or medication candidate. | Simple and conservative. | Over-quotes partner or excluded items that are not the primary user's executable task. |
| B. `suggestedCardType` + `assignedTo` | Require quote only when injection or medication is assigned to `my_action`. | Matches the operational risk: primary user-owned executable medication/injection review. | Requires both type and assignment to be present in the candidate contract. |
| C. `userMarkedImportant` | Require quote when the user marks a candidate important. | User-controlled emphasis. | Too late and optional; a risky medication candidate can avoid quote before the user notices it. |
| D. All candidates | Require quote for every candidate. | Maximum traceability. | Adds noise to low-risk support, record, and excluded rows; makes review harder to scan. |
| E. No mandatory quote toggle | Let the component or user preference decide. | Flexible presentation. | Fragments the safety policy and can hide source evidence on medication/injection review. |

## Decision

Adopt **Option B**:

```text
mustInlineQuote(candidate) =
  candidate.suggestedCardType in ('injection', 'medication')
  and candidate.assignedTo === 'my_action'
```

The canonical implementation is the domain function `mustInlineQuote`. UI components may render the quote differently, but they must not redefine the policy locally.

## Consequences

- Medication and injection candidates owned by the primary user must keep original source wording visible in Confirm UI.
- Partner support, clinic visit, clinic confirmation, record, general action, and excluded candidates do not require mandatory inline quotes under this policy.
- Legacy candidates with missing source offsets can still render by source text fallback in the UI slice.
- The policy remains deterministic and independent of LLM output confidence.

## Prohibited

- Do not implement this rule as component-local branching.
- Do not use `userMarkedImportant`, demo flags, presentation mode, or onboarding mode to bypass the policy.
- Do not infer medication or injection safety priority from this rule; display safety level remains a separate confirmed-card policy.
- Do not make split candidate source offsets non-null for legacy rows to support this UI.

## Related

- ADR 0013: Confirm spine canonical
- `docs/specs/spec-capture-action-split.md`
- Issue #423
