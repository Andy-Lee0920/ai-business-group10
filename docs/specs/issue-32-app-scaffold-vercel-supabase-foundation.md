# Spec: #32 준비 0 — Vercel에서 열리는 웹앱 뼈대 만들기

## Purpose / Why & Who

Prepare the repository so the Fevio [페비오] SLC loop can be implemented with small TDD vertical slices instead of one untestable big-bang change.

Target user for this spec is the development team: contributors need a working Next.js/Supabase/Vercel/test foundation before #23–#27 can be solved safely.

## Linked issue

- GitHub Issue #32 — 준비 0: Vercel에서 열리는 웹앱 뼈대 만들기

## SLC relationship

This does not complete the user-facing SLC by itself. It creates the minimum executable surface needed to later prove:

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

## Scope

### P0 included

- Next.js + TypeScript app scaffold.
- Mobile-first app shell route.
- Design-token baseline wired to the app shell.
- Supabase browser/server client helpers with env validation.
- `.env.example` remains the only committed env file.
- Placeholder routes for future slices:
  - auth callback
  - privacy gate
  - home/onboarding
  - capture
  - split review
  - partner view
- Vitest unit test setup.
- Playwright smoke test setup.
- Vercel-compatible build configuration.

### P0 excluded

- Real Google OAuth flow implementation (#23).
- Real Supabase migrations/RLS (#35/#23+).
- Capture/Confirm transaction (#24).
- Dynamic Home composition logic (#26).
- Partner token/link implementation (#27).
- OpenRouter/BYOK (#28 P1).

## Public interface after this issue

Expected commands after scaffold:

```bash
npm install
npm run dev
npm run test
npm run test:e2e
npm run build
```

Expected initial routes may be placeholders but should compile:

```text
/
/auth/callback
/privacy
/capture
/split-review
/partner/[token]
```

## TDD plan

Use tracer bullets. Do not write every test up front.

### Cycle 1 — App boots

RED:

- Add a Playwright smoke test: visiting `/` on a mobile viewport renders the app name and a safe SLC-oriented shell.

GREEN:

- Add minimal Next.js app shell to pass.

Verify:

```bash
npm run test:e2e
```

### Cycle 2 — Env contract is explicit

RED:

- Add unit test for env parsing: missing Supabase public env returns a clear configuration error in server-only validation code.

GREEN:

- Add minimal env helper and `.env.example` alignment.

Verify:

```bash
npm run test
```

### Cycle 3 — Supabase clients are constructible

RED:

- Add unit/integration-light test that client helper refuses empty config and accepts explicit test config.

GREEN:

- Add minimal Supabase client factory wrappers.

Verify:

```bash
npm run test
```

### Cycle 4 — Vercel build does not depend on secrets

RED:

- Add build/check expectation that the app can compile with placeholder non-secret public env or documented CI env.

GREEN:

- Ensure optional server secrets are not required at build for P0 placeholder shell.

Verify:

```bash
npm run build
```

## Acceptance criteria

- `package.json`, `tsconfig.json`, Next.js config, test config, and Playwright config exist.
- `npm run dev` boots the app locally.
- `npm run test` passes at least the scaffold/unit tests.
- `npm run test:e2e` passes mobile shell smoke test.
- `npm run build` succeeds without real production secrets.
- `.env.example` documents required public/server env variables.
- No real secret appears in tracked files.
- Routes needed by #23–#27 have placeholders or route groups ready for vertical-slice implementation.

## Validation evidence expected in PR

- Command output for `npm run test`.
- Command output for `npm run test:e2e`.
- Command output for `npm run build`.
- Screenshot or Playwright trace/screenshot of mobile shell if UI changed.
- `git grep`/secret scan note confirming no real secrets were committed.

## Risks / notes

- Keep this issue foundational. Do not hide #23–#27 implementation inside the scaffold PR.
- Avoid premature UI abstraction. Add only primitives needed by the scaffold and next immediate issues.
- Prefer boring defaults unless the repo already establishes another pattern.
