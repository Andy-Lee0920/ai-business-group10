# Fevio [페비오] SLC Product Definition

## SLC meaning

For this repository, **SLC** means **Simple, Lovable, Complete**:

- **Simple**: one clear webapp path, no native app dependency, no AI dependency for P0.
- **Lovable**: mobile-first, warm, safe, partner-friendly experience based on the product design deck.
- **Complete**: the first real care loop works end-to-end with persisted Supabase data and Vercel Preview validation.

## Source of truth

The implementation source of truth is:

1. `docs/01_product_requirements/fertility-support-prd-v1.0.md`
2. GitHub Epic #29 and P0 issues #23–#27
3. This SLC definition for the first Vercel-first release gate

If older PRD text conflicts with the final 20 decisions, the final 20 decisions win.

## SLC product goal

Deliver a Vercel Preview webapp where a first-time primary user can complete the core Fevio [페비오] loop:

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

This is the first success condition for “웹앱 경험 위주 먼저”.

## P0 included

- Next.js + TypeScript responsive webapp deployed to Vercel Preview.
- Supabase Auth Google OAuth.
- Privacy and clinical boundary gate before sensitive data write.
- Couple shell bootstrap: `couples`, primary `couple_members`, partner placeholder, `couple_states`.
- Manual post-visit capture and deterministic line split.
- 4-button classification: my action, partner action, clinic confirmation, excluded.
- Confirm transaction that creates `split_candidates`, `care_action_cards`, and sets `first_capture_completed_at` once.
- Deterministic `inferCardType()`, `computeCareDay()`, and display-only `computeDisplaySafetyLevel()`.
- Dynamic Home for `onboarding`, `clinic_day`, `injection_day`, `waiting_day`, and `routine_day`.
- Partner 7-day read-only share link with live server-filtered view and acknowledgement.
- RLS and integration tests for couple isolation and partner access boundaries.

## P0 excluded

- App Store/native app release.
- Native push notifications.
- OCR prescription ingestion.
- Medical advice, dosage recommendation, treatment strategy, diagnosis, or success prediction.
- Kakao 알림톡/SMS fallback.
- Partner account onboarding.
- LLM-required workflow.

## P1 optional

OpenRouter BYOK is optional after the manual P0 loop works. It must remain advisory only:

- raw user API keys live in Supabase Vault only;
- LLM can suggest split candidates only;
- LLM must not decide `assigned_to`, `card_type`, or safety priority;
- users without a key must complete all P0 workflows.

## Design direction

Use `docs/02_product_design_10` as a design reference, not as raw production UI.

Initial implementation tokens:

- Primary sage: `#6F8F6E`
- Accent lavender: `#B9AED6`
- Warm neutral: `#F6F4F1`
- Warning coral: `#E07A68`
- Soft cards, large touch targets, clear status badges, Korean-first readability.

## Secret and collaborator policy

Coauthors do **not** need shared raw secrets committed to git.

- Commit `.env.example`, never real `.env*` files.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-public config, but real project values should still be managed through Vercel/Supabase environment settings, not hardcoded into source.
- Never commit `SUPABASE_SERVICE_ROLE_KEY`, DB password, JWT secret, Google OAuth secret, OpenRouter keys, Vault secrets, dump files, or local Supabase runtime files.
- Coauthors who need deployment access should be invited to Vercel/Supabase with least-privilege roles.
- Coauthors who only implement frontend can use `.env.example` and a local/dev Supabase project or receive env values through a secure password manager.

## SLC release gate

The SLC is complete only when the following evidence exists:

- Vercel Preview URL opens on mobile viewport.
- Google OAuth login succeeds.
- Privacy Gate blocks sensitive writes until accepted.
- First logged-in home is `onboarding`, not `routine_day`.
- Capture CTA persists `visit_inputs` and `action_split_drafts` only.
- Classification button clicks do not write classification state to DB.
- Confirm transaction persists `split_candidates` and `care_action_cards` and sets `first_capture_completed_at` once.
- Dynamic Home changes from onboarding to the relevant care day.
- Supabase RLS integration tests pass for couple isolation.
- Partner share link shows only sanitized partner-visible cards and does not expose raw token or raw visit memo.
