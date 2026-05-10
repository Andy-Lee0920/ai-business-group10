# Fevio [페비오] Agent Mental Model

This file is not a project dashboard. Do not use it to track current progress, issue status, or temporary decisions.

Use this file as the stable mental model for working in this repository: what the product is, what must stay true, and how agents should reason while changing code.

## Product identity

Fevio [페비오] is a **care-operation support webapp** for IVF patients and couples.

It helps a primary user turn clinic instructions into confirmed care actions, then reshapes the home screen around today's care context. It is not a diagnosis tool, treatment planner, dosage advisor, or medical-device substitute.

The product should feel:

- calm rather than urgent by default;
- precise about user-confirmed actions;
- warm and partner-aware;
- privacy-first;
- mobile-first;
- deterministic before AI-assisted.

## Core product spine

Think of the product as one care loop:

```text
Authenticate
→ accept privacy and clinical boundaries
→ create couple shell
→ capture clinic memo
→ split lines into candidate actions
→ user confirms meaning and ownership
→ persist confirmed care action cards
→ compute today's care context
→ render dynamic home
→ optionally share a sanitized partner action view
```

Every feature should either strengthen this loop or explicitly stay out of P0.

## Source hierarchy

When deciding what to implement, read source artifacts in this order:

1. relevant GitHub issue/spec for the active slice
2. `docs/01_product_requirements/SLC target/SLC target.md`
3. final PRD decisions document: `docs/01_product_requirements/fertility-support-prd-v1.0.md`
4. `docs/adr/` for accepted architecture/product decisions
5. `CONTEXT.md` for shared domain language
6. `CONTRIBUTING.md`
7. `docs/schema-rls-matrix.md`
8. existing code and tests

If this file conflicts with a more specific current issue/spec, follow the issue/spec unless it violates the invariants below.

Do not update this file for routine progress. Put progress, release status, and issue ordering in GitHub issues, specs, `README.md`, or `docs/01_product_requirements/SLC target/SLC target.md`.

## System model

### Auth and couple shell

A signed-in primary user should have exactly one active couple shell for v1.0:

- one `couples` row;
- one primary `couple_members` row linked to the user;
- one partner placeholder member;
- one `couple_states` row.

The app should be resilient: DB trigger first, idempotent bootstrap fallback second.

### Privacy before data

Sensitive care data must not be written before the privacy and clinical boundary gate is accepted.

The privacy gate is not decoration. It is a write boundary.

### Capture and split

Capture is intentionally low-friction. The user may paste messy clinic instructions.

On Capture CTA:

- save the raw input;
- create a split draft shell;
- do not persist final classification yet.

Classification is user-controlled. Button taps may update local UI state, but final classified candidates and care cards are persisted only on Confirm.

### Confirmation-first care cards

`CareActionCard` records are user-confirmed operational tasks, not model-authored medical truth.

Executable home components must render confirmed cards only. Drafts, uncertain items, or needs-confirmation records must not become executable instructions.

### Dynamic home

The home screen is a function of care context, not a static dashboard.

Care day should be computed deterministically from persisted state and confirmed cards. First login before capture is onboarding, not routine day.

### Partner view

Partner access is link-based and accountless for v1.0.

Partner View is a sanitized, server-filtered live projection of partner-visible action cards. It must not expose raw visit notes, private user context, raw tokens, direct database access, or broad medical detail.

## AI and automation boundary

Manual workflow must work without AI.

LLM assistance, when enabled later, is advisory only:

- it may suggest split candidates;
- it must not assign ownership;
- it must not decide safety priority;
- it must not infer dosage, treatment strategy, diagnosis, or medical recommendations;
- it must fail closed into manual review.

Raw user API keys belong in Vault/server-controlled storage only, never in git or browser-exposed state.

## Data and security invariants

Keep these true across all changes:

- RLS isolates couple-scoped data.
- Anonymous users cannot directly query private care tables.
- Partner token validation happens through server-controlled code.
- Partner raw token is never stored; only token hashes are stored.
- Service-role privileges stay server-side and minimal.
- Real secrets are never committed.
- `display_safety_level` is deterministic UI priority, not stored medical judgment.
- Schema changes come with an RLS/test story.

## Design mental model

Use the product design deck as visual direction, not as production UI assets.

Translate it into reusable tokens and components:

- sage primary color;
- lavender accent;
- warm neutral surfaces;
- coral warning states;
- soft cards;
- large touch targets;
- clear status badges;
- Korean-first readability.

Avoid generic SaaS UI. The interface should reduce panic, clarify ownership, and make the next safe action obvious.

## Engineering posture

Prefer:

- small vertical slices;
- explicit state transitions;
- deterministic pure functions;
- typed contracts;
- tests around safety and boundaries;
- deletion/reuse over new abstraction;
- boring infrastructure over clever automation.

Avoid:

- scope expansion before the SLC loop works;
- AI-dependent P0 paths;
- persisted model judgments;
- hidden background writes from UI classification controls;
- raw clinical text in partner views;
- secrets in source files;
- progress notes inside agent instruction files.



Issue closure discipline:

- Do not close an issue while a known Red remains.
- Red includes failing tests, deployment errors, failing checks, unresolved external settings, or unverified acceptance criteria.
- Create a child issue for each specific Red → Green transition.
- Post Red evidence and Green evidence as issue comments so the work log is visible to the team.
- Close parent issues only after linked child Red issues are Green or explicitly out of scope.

Notification discipline:

- Use email notifications only for review-ready specs or milestone-impacting PRs.
- Do not use email notifications for draft updates, typo fixes, or repeated CI retries.
- Prefer normal GitHub notifications for routine review requests.

## Behavioral coding discipline

The following guidelines are adopted as a benchmark to reduce common LLM coding mistakes. Merge them with the project-specific mental model above as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if there are fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Verification model

Before claiming completion, prove the actual claim:

- pure logic with unit tests;
- data boundaries with integration/RLS tests;
- user flows with browser/E2E smoke evidence;
- visual changes with mobile viewport evidence;
- secret-sensitive paths with leakage checks.

If validation cannot run, state the gap and use the next-best check. Do not describe unverified behavior as complete.

## Where status belongs

- Current SLC definition: `docs/01_product_requirements/SLC target/SLC target.md`
- Contributor workflow: `CONTRIBUTING.md`
- Schema/RLS ownership: `docs/schema-rls-matrix.md`
- Current implementation order and progress: GitHub issues / README
- Feature-specific intent: `docs/specs/`

This file should remain stable unless the product or engineering philosophy changes.
