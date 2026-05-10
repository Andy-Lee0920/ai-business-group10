# Contribution Working Note — specctl skill by JunHyun

This document preserves the project-specific SLC/issue-first contribution guidance that was first drafted while preparing the Fevio [페비오] repository.

For general contributor onboarding, use [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
For agent/runtime instructions, use [`../../AGENTS.md`](../../AGENTS.md) and [`../../CLAUDE.md`](../../CLAUDE.md).

---

# Contributing

This repository uses a **spec-first, SLC-first** workflow. Contributors should align every change with the final PRD decisions, the active GitHub issue, and the SLC release gate before writing implementation code.

## 1. Source of truth

Use these in order:

1. `docs/01-product/prd-v1.0.md`
2. GitHub Epic #29 and its linked implementation issues
3. `docs/01-product/slc-target.md`
4. `docs/03-engineering/schema-rls-matrix.md`
5. The current feature spec in `docs/specs/` when a spec exists

If older PRD text conflicts with the final 20 decisions, the final 20 decisions win.

## 2. Current product target: SLC

The first release target is **Simple, Lovable, Complete**:

```text
Vercel Preview URL
→ Google login
→ Privacy Gate
→ onboarding home
→ 병원 메모 입력
→ Manual Line Split
→ Confirm
→ Supabase에 visit_inputs / split_candidates / care_action_cards 생성
→ Dynamic Home이 onboarding에서 clinic/injection/routine 중 하나로 전환
```

Do not expand the P0 scope until this loop works and is verified.

## 3. Required implementation order

Follow this order unless a maintainer explicitly changes it:

1. #32 — App Scaffold + Vercel/Supabase Foundation
2. #33 — SLC Product Contract + Release Gate
3. #34 — Design System Extraction
4. #35 — Supabase Schema/RLS Baseline Alignment
5. #23 — Auth + Privacy Gate + Couple bootstrap
6. #25 — CareActionCard model + care functions
7. #24 — Capture + Manual Line Split + Confirm
8. #26 — Dynamic Care Context Home / ComponentTree P0
9. #27 — Partner Share Link + Partner Action View
10. #28 — OpenRouter BYOK, P1 optional only after manual P0 works

## 4. Spec-first workflow with `specctl`

Before implementation-heavy work, create or update a feature spec.

### Check the tool

From the repository root:

```bash
python3 -m specctl --help
```

Expected commands include:

```text
init, start, submit, notify, ci-check
```

### Initialize if needed

```bash
python3 -m specctl init
```

This prepares files such as `.specctl/team.yml`, `email-notification-setting.md`, and `docs/specs/` depending on the installed version.

### Start a spec branch/file

```bash
python3 -m specctl start <feature-name>
```

This may switch to `main`, pull `origin/main`, create a `spec/<feature-name>` branch, and create `docs/specs/<feature-name>.md`.

### What every spec must include

Each spec should cover:

- **Purpose / Why & Who**: target user, problem, and relation to the SLC flow.
- **Scope**: P0 must-have demo behavior; P1/P2 or excluded work.
- **UX / AI**: user flow, state transitions, and AI behavior if applicable.
- **Data / Security**: Supabase tables, RLS boundaries, env/secret impact.
- **Success**: concrete acceptance criteria tied to Vercel Preview or tests.
- **Validation**: unit, integration, E2E, visual, or manual verification evidence.

## 5. Safety rules for `specctl` and GitHub actions

Do **not** run the following unless explicitly requested by a maintainer:

```bash
python3 -m specctl submit ...
python3 -m specctl notify ...
git commit
git push
gh pr create
```

Also do not send email notifications unless explicitly asked. If email notification is requested, follow `email-notification-setting.md` and never commit SMTP credentials.


Email frequency policy:

- Use `--email` only for review-ready specs or milestone-impacting PRs.
- Do not use `--email` for draft updates, typo fixes, or repeated CI retries.
- Prefer `--notify` for normal review requests.

## 6. Secret and environment policy

Never commit real secrets.

Commit:

- `.env.example`
- documentation describing required variables

Do not commit:

- `.env`, `.env.local`, `.env.production`, or any real `.env*` file
- `.vercel/`
- Supabase temp/runtime secret files
- service role keys
- DB passwords
- JWT secrets
- Google OAuth secrets
- OpenRouter keys
- Supabase Vault values
- database dumps or local credential exports

Coauthors do not need raw shared secrets in git. Contributors who need deployment/backend access should be invited to Vercel/Supabase with least-privilege roles or receive values through a secure password manager.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-public configuration, but real project values should still be managed through Vercel/Supabase environment settings rather than hardcoded source constants.

## 7. Medical and privacy boundaries

This product must not provide medical advice.

Required invariants:

- Privacy Gate must be accepted before sensitive writes.
- LLM output must never decide `assigned_to`, `card_type`, dosage, treatment strategy, or safety priority.
- `display_safety_level` is deterministic UI priority, not a stored medical judgment.
- Home executable components render confirmed cards only.
- Partner View is a sanitized live server projection only.
- Partner raw tokens must never be stored; store token hashes only.

## 8. Design contribution rules

Use `docs/02-design` as a reference deck, not as production screens.

Contributors should extract reusable tokens and components:

- sage primary color
- lavender accent
- warm neutral background
- warning coral
- soft cards
- large touch targets
- clear badges
- Korean-first readability

Do not ship slide PNGs as the app UI.

## 9. Testing expectations

Before marking work complete, provide the smallest evidence that proves the claim.

Expected checks by change type:

- Pure logic: unit tests for line split, `inferCardType()`, `computeCareDay()`, `computeDisplaySafetyLevel()`, ComponentTree validation.
- Supabase/data changes: migrations plus RLS/integration tests.
- UI flow changes: Playwright or equivalent smoke/E2E evidence.
- Partner link changes: token leakage checks, expired/revoked link tests, sanitized payload checks.
- Visual changes: mobile viewport screenshot or visual smoke evidence.

Do not claim SLC completion without fresh evidence for the SLC release gate in `docs/01-product/slc-target.md`.

## 10. Commit message protocol

When a maintainer explicitly asks you to commit, use the repo's Lore protocol:

```text
<intent line: why the change was made, not what changed>

Constraint: <external constraint that shaped the decision>
Rejected: <alternative considered> | <reason for rejection>
Confidence: <low|medium|high>
Scope-risk: <narrow|moderate|broad>
Directive: <forward-looking warning for future modifiers>
Tested: <what was verified>
Not-tested: <known gaps in verification>
```

Keep commits small, reviewable, and tied to an issue/spec.
