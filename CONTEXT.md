# Fevio [페비오] Context

This file defines the stable domain language for Fevio. Use these terms in issues, specs, tests, PRs, and agent instructions so future contributors do not invent parallel names for the same concept.

## Product identity

**Fevio [페비오]** is a care-operation support webapp for IVF patients and couples. It helps a primary user turn clinic instructions into confirmed care actions and share only necessary partner actions.

Fevio is not a diagnosis tool, treatment planner, dosage advisor, success predictor, or medical-device substitute.

## Core domain terms

### Primary user

The signed-in user who enters clinic notes, confirms action meaning, and owns the private care workspace. In persona examples this is often 김민지.

### Partner

The person who receives an accountless share link and sees only sanitized, partner-visible actions. The partner should not see raw visit notes or broad medical context.

### Couple shell

The minimum persisted structure created after auth for v1.0:

- one `couples` row;
- one primary `couple_members` row;
- one partner placeholder member;
- one `couple_states` row.

### Privacy Gate

The explicit consent and clinical-boundary step that must be accepted before writing sensitive care data.

### Clinic memo

The messy text a primary user enters after a hospital visit. It may include incomplete, uncertain, or mixed instructions.

### Visit input

The persisted raw clinic memo. It is evidence of what the user entered, not confirmed executable guidance.

### Split draft

The intermediate line-split working state created from a visit input. It supports review but does not by itself create executable care actions.

### Split candidate

A line-level candidate produced by manual review or advisory assistance. It becomes productively useful only after user confirmation.

### Care action card

A user-confirmed operational task. Home and partner views should render confirmed care action cards, not raw notes or unconfirmed drafts.

### Care day

The deterministic home-mode label computed from couple state and confirmed cards. v1.0 terms are:

- `onboarding`
- `clinic_day`
- `injection_day`
- `waiting_day`
- `routine_day`

### Dynamic Home

The home experience produced from the current care day and confirmed cards. It is not a static dashboard.

### Partner Action View

The sanitized, accountless, server-filtered live projection opened through a 7-day share link.

### Display safety level

A client-side display priority derived deterministically from confirmed data. It is not medical judgment and should not be stored as model-authored truth.

## Product invariants

- Manual P0 must work without LLM assistance.
- AI assistance, if enabled later, is advisory only.
- Sensitive writes require Privacy Gate acceptance.
- Partner access must be action-only and sanitized.
- RLS must isolate couple-scoped data.
- Real secrets never belong in git.
- SLC success is one vertical care loop, not a complete health platform.

## Architecture reading order

1. GitHub issue/spec for the active slice, as long as it does not violate product invariants.
2. `docs/01_product_requirements/SLC target/SLC target.md` for the SLC release gate.
3. `docs/01_product_requirements/fertility-support-prd-v1.0.md` for PRD detail.
4. `docs/adr/` for decisions that future changes should not relitigate casually.
5. `CONTEXT.md` for shared domain language.
6. `README.md` and `docs/README.md` for orientation/navigation.
