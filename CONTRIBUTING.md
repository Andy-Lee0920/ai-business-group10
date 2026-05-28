# Contributing to Fevio [페비오]

Thanks for contributing. This repository uses a **spec-first workflow with `specctl`** so collaborators can discuss intent, scope, UX, data boundaries, and validation before implementation.

## Who this guide is for

Use this guide if you are:

- opening a new feature or fix proposal;
- implementing an existing GitHub issue;
- reviewing a spec or pull request;
- joining as a coauthor/collaborator without direct access to production secrets.

Project-specific agent notes live in `AGENTS.md` and `CLAUDE.md`. The current SLC product contract lives in [`docs/01-product/slc-target.md`](<docs/01-product/slc-target.md>).

## Contribution principles

- Start from an issue or a spec; avoid untracked drive-by implementation.
- Keep changes small, reviewable, and tied to one feature or bug.
- Preserve the SLC goal before expanding scope.
- Do not commit real secrets or local environment files.
- Add validation evidence before asking for review.
- Do not add AI/LLM behavior to P0 unless the manual SLC loop already works.

## Source of truth

When contributing, read these in order:

1. `docs/01-product/original-note-hyunjoo.md` for product origin and user pain
2. GitHub Epic #29 and the relevant implementation issue
3. `docs/01-product/slc-target.md`
4. `docs/01-product/prd-v1.0.md`
5. `docs/03-engineering/schema-rls-matrix.md`
6. the active spec in `docs/specs/`, if one exists

If implementation details conflict, the final 20 decisions win. If product meaning feels narrowed or distorted, return to `docs/01-product/original-note-hyunjoo.md` and preserve that original user pain.

## 1. Prepare your local environment

Clone the repository and install the normal project dependencies once the app scaffold exists.

Copy environment examples only:

```bash
cp .env.example .env.local
```

Fill `.env.local` with your own development values or values shared through an approved secure channel. Never commit `.env.local`.

## 2. Check `specctl`

From the repository root, verify the CLI is available:

```bash
python3 -m specctl --help
```

Expected commands include:

```text
init, start, submit, notify, ci-check
```

If the repository has not been initialized for specctl yet, run:

```bash
python3 -m specctl init
```

## 3. Start a feature spec

For a new contribution, create a spec branch/file:

```bash
python3 -m specctl start <feature-name>
```

Use a short kebab-case feature name, for example:

```bash
python3 -m specctl start auth-privacy-gate
python3 -m specctl start manual-split-confirm
python3 -m specctl start partner-share-link
```

Depending on the installed `specctl` version, this may create a branch like `spec/<feature-name>` and a file like `docs/specs/<feature-name>.md`.

## 4. Write the spec before implementation

A good spec should include:

- **Purpose / Why & Who**: the user problem and target user.
- **Issue link**: the GitHub issue this work addresses.
- **SLC relationship**: how this advances the SLC flow.
- **Scope**: P0 must-have behavior and explicit out-of-scope items.
- **UX flow**: screens, states, empty states, and error states.
- **Data model**: tables, fields, migrations, and RLS impact.
- **Privacy/security**: secret handling, sensitive data boundaries, partner access boundaries.
- **Validation**: unit, integration, E2E, visual, or manual checks.
- **Acceptance criteria**: concrete evidence required for review.

Do not use the spec to silently expand scope beyond the linked issue.

## 5. Implement after the spec is clear

When implementing:

- keep the diff focused on the spec;
- prefer deterministic logic over hidden heuristics;
- update docs if behavior, env vars, or setup changes;
- add or update tests with the smallest useful coverage;
- do not add new dependencies without a clear reason in the spec or PR.

## 6. Validate before review

Use the checks appropriate to your change.

Examples:

- Pure functions: unit tests for line splitting, `inferCardType()`, `computeCareDay()`, and `computeDisplaySafetyLevel()`.
- Supabase changes: migration checks plus RLS/integration tests.
- UI flows: Playwright or equivalent smoke/E2E evidence.
- Partner link changes: token leakage checks, expired/revoked link behavior, sanitized payload checks.
- Design changes: mobile viewport screenshot or visual smoke evidence.

If a check cannot run, explain why and provide the next-best evidence.

## 7. Submit for review

Only submit when the spec and implementation are ready for review.

The `specctl submit` command may create commits, push a branch, and open a PR depending on the installed version:

```bash
python3 -m specctl submit docs/specs/<feature-name>.md
```

Add notification flags only when the team expects them:

```bash
python3 -m specctl submit docs/specs/<feature-name>.md --notify
python3 -m specctl submit docs/specs/<feature-name>.md --notify --email
```

Email notification requires SMTP environment variables. See `email-notification-setting.md`. Never commit SMTP credentials.


Email frequency policy:

- Use `--email` only for review-ready specs or milestone-impacting PRs.
- Do not use `--email` for draft updates, typo fixes, or repeated CI retries.
- Prefer `--notify` for normal review requests.


## 8. Red issue closure rule

Do not close an issue while a known Red remains.

Use this rule for tests, deployments, configuration, security, and review blockers:

- If the current issue still has a failing check, deployment error, unresolved external setting, or unverified acceptance criterion, leave it open.
- Create a child issue for the specific Red → Green transition.
- Link the child issue from the parent issue.
- Close the child issue only after Green evidence is posted.
- Close the parent issue only when all child Red issues are Green or explicitly out of scope.

Example:

```text
Parent: #38 Vercel Fevio Preview 정리
Child: Vercel Root Directory의 old app 설정 제거하기
Red: deployment log says Root Directory "old-app-root" does not exist
Green: new deployment starts from repo root package.json
```

Issue comments should carry the work log: Red evidence, Green evidence, commands run, remaining risks.

## 9. Secret policy

Never commit real secrets.

Commit:

- `.env.example`
- documentation for required variables

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

Coauthors should not receive raw secrets through git. Use least-privilege Vercel/Supabase access or a secure password manager.

## 10. Medical and privacy boundaries

Fevio [페비오] is not a medical advice product.

Contributions must preserve these invariants:

- Privacy Gate is accepted before sensitive writes.
- Home executable components render confirmed cards only.
- Partner View is a sanitized live server projection only.
- Partner raw tokens are never stored; store hashes only.
- LLM output must not decide `assigned_to`, `card_type`, dosage, treatment strategy, or safety priority.
- Safety priority is deterministic UI display logic, not stored medical judgment.

## 11. File naming

Use lowercase kebab-case for docs and specs:

```text
docs/specs/auth-privacy-gate.md
docs/05-contribution/specctl-by-junhyun.md
```

Avoid spaces and parentheses in filenames because they are awkward in shell commands, URLs, and automation.

## 12. Maintainer notes

Maintainers may ask contributors to use direct GitHub or git commands. When doing so, keep the same spec-first and secret-safe rules.

If a maintainer asks for a manual commit, use the repository's Lore commit protocol described in `AGENTS.md`.

The words `git commit`, `git push`, and `gh pr create` are intentionally treated as maintainer-controlled external actions in agent workflows.
