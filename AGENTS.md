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

1. `docs/01-product/original-note-hyunjoo.md` for the originating request, user pain, and long-term product axes
2. relevant GitHub issue/spec for the active slice
3. `docs/01-product/slc-target.md` for the current release gate
4. final PRD decisions document: `docs/01-product/prd-v1.0.md`
5. `docs/04-decisions/` for accepted architecture/product decisions
6. `CONTEXT.md` for shared domain language
7. `CONTRIBUTING.md`
8. `docs/03-engineering/schema-rls-matrix.md`
9. existing code and tests

If a specific issue/spec narrows scope, follow it only as an implementation slice of `docs/01-product/original-note-hyunjoo.md`. Do not let SLC simplification erase the original product pain: irregular clinic schedules, medication/injection timing risk, couple information asymmetry, emotional load, and sensitive-data trust.

Do not update this file for routine progress. Put progress, release status, and issue ordering in GitHub issues, specs, `README.md`, or `docs/01-product/slc-target.md`.

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

- Current SLC definition: `docs/01-product/slc-target.md`
- Contributor workflow: `CONTRIBUTING.md`
- Schema/RLS ownership: `docs/03-engineering/schema-rls-matrix.md`
- Current implementation order and progress: GitHub issues / README
- Feature-specific intent: `docs/specs/`

This file should remain stable unless the product or engineering philosophy changes.

### URL-action-result closure rule

Every issue that changes product behavior or product UI must include at least one Green condition in this form:

```text
[URL]에서 [사용자 역할]이 [행동]했을 때 [기대 결과]를 본다.
```

Examples:

- `/partner/[token]`에서 파트너가 링크를 열었을 때 `오늘 내 역할`, `도움 행동`, `오늘 피하기`를 3초 안에 이해한다.
- `/home?care=injection`에서 사용자가 홈을 열었을 때 첫 viewport가 카드 목록이 아니라 atmosphere + moment hero + primary action으로 보인다.
- `/capture`에서 사용자가 병원 안내문을 촬영하려고 할 때 `image/*` camera input과 붙여넣기 input이 같은 흐름 안에서 보인다.

Do not accept purely layer-based Green conditions such as "component exists", "API returns 200", or "test passes" unless they are tied back to an actual URL, user action, and expected visible result.

### Epic vertical-slice owner rule

An Epic cannot be closed from component/demo/API evidence alone.

Before closing an Epic, a named vertical slice owner must verify the deployed URL end-to-end and comment with:

- URL verified
- user role
- action taken
- expected result observed
- automated test evidence
- production/Vercel smoke evidence or a clearly stated deployment gap

Example:

```text
Vertical slice owner: Codex
URL: https://project-oznp0.vercel.app/home?care=waiting
Role/action/result: primary user opens waiting-day home and sees quiet atmosphere, one moment sentence, one action, then a low-density glass sheet after in-frame scroll.
Evidence: Playwright test X passed, production smoke screenshot attached.
```

If a real user URL still exposes raw implementation language, card-grid regression, raw projection fields, or broken mobile frame behavior, the Epic remains open even when all child implementation tickets are individually Green.

## Onboarding Principle

Fevio onboarding does not collect profile data for its own sake.

The purpose of onboarding is to create the user's first care state and configure how that state will generate different utility interfaces for the patient and partner.

Every onboarding question must change at least one of:
`inferredStage` / `firstCareItem` / `utilityCards` / `roleContext` / `sharingLevel` / `partnerProjection` / `explanationDensity`.

If an onboarding question does not affect the generated care UI, it should not be asked during onboarding.

Onboarding copy tone: Fevio calmly receives hospital instructions. Write short, polite, practical Korean based on what the clinic instructed. Do not use cute reassurance, emotional overreach, internal product terms, or medical-test language.

## Implementation anti-patterns Codex/Claude must reject

These are recurring failure modes in this codebase. Treat them as architectural guardrails, not style preferences.

### 1. Demo flags inside domain logic

Do not solve demo/product differences by spreading `isDemoMode`, `presentationMode`, or similar flags through domain logic or product components.

Correct pattern:

```text
One domain function.
Different data injection points.
/demo feeds fixture data into the same parser/domain contract.
/onboarding feeds persisted/Supabase data into the same parser/domain contract.
```

For example, clinic memo parsing should live in one domain module such as `clinic-memo-parser.ts`. `/demo` may pass fixture clinic memo data into it; `/onboarding` may pass Supabase-backed user data into it. The parser must not branch on demo mode.

### 2. UI-variant issues instead of data-contract issues

Do not split future implementation issues by UI variant names such as `clinic-day-home.tsx` vs `injection-day-home.tsx` unless the data contract has already been unified.

Prefer issues framed around:

- input data contract;
- domain transformation;
- renderer/projection contract;
- URL-action-result acceptance;
- persistence and RLS boundary.

If an issue only asks for a visual variant without naming the shared data contract, stop and rewrite the issue before implementation.

### 3. Weak Definition of Done

Visual inspection of a Vercel URL is required for product UI, but it is not sufficient.

For product behavior or deployed flows, DoD must include the relevant subset of:

- `tsc --noEmit` / `npm run typecheck` passing;
- targeted unit/integration tests passing;
- browser/E2E or URL-action-result evidence;
- Vercel preview/production URL smoke for the changed visible surface;
- RLS-sensitive API path check on the deployed URL when the change touches Supabase-backed data;
- confirmation that required `supabase/migrations` are applied remotely, or an explicit deployment gap comment.

Do not close an issue if the acceptance claim depends on RLS, environment variables, or remote migrations that were not verified or explicitly marked as a deployment gap.

### 4. Type widening for implementation convenience

`Record<string, unknown>`, `Record<string, string | number | boolean>`, and `any` are allowed only when the type is genuinely unbounded at the boundary.

They are not allowed as shortcuts inside domain models, demo scenarios, utility-card contracts, or renderer props.

Prefer discriminated unions, exact interfaces, `satisfies`, and exhaustive `never` checks. If a broad record already exists, do not widen it further; either narrow it in the touched slice or leave a concrete follow-up issue.
