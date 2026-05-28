# ADR 0001 — SLC-first, manual-first Fevio webapp

## Status

Accepted

## Context

Fevio [페비오] needs to become a believable webapp experience before expanding into native app, AI automation, or broad fertility-health features.

The team has many useful product decisions, but the first proof must be small enough to validate in Vercel Preview and concrete enough for non-developer contributors to understand.

## Decision

Build the first product slice as a Vercel Preview responsive webapp backed by Supabase Auth/Postgres/RLS.

The first SLC loop is:

```text
Google login
→ Privacy Gate
→ onboarding home
→ clinic memo capture
→ Manual Split
→ Confirm
→ persisted visit_inputs / split_candidates / care_action_cards
→ Dynamic Home changes from onboarding to the relevant care day
```

Manual confirmation is the P0 path. LLM/OpenRouter support is P1 and advisory only.

## Consequences

- App Store/native release is out of scope for the first SLC.
- P0 cannot depend on LLM availability, user API keys, or model output.
- The interface for early implementation is the issue/spec/TDD loop, not a broad product backlog.
- Design work should become reusable webapp tokens and screens, not one-off image insertion.
- Vercel owns the Next.js app surface; Supabase owns Auth, data, RLS, and secrets-adjacent backend concerns.
