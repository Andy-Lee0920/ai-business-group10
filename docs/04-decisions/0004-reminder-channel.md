# ADR 0004 — P0 reminder channel is email-only

## Status

Amended — 2026-05-18 (MVP decision)

2026-05-18 amendment: **이메일 채널 폐기, PWA 웹 push로 전환.** MVP closed beta에서 리마인더 채널은 PWA Service Worker 기반 웹 push로 결정됐다. Resend/이메일 발송 코드는 MVP에서 사용하지 않는다.

- 채널: PWA 웹 push (VAPID + Service Worker)
- 타이밍: T-60분 + T-15분 (2회, 이슈 #347)
- 스케줄러: Supabase pg_cron (매분 실행)
- Android Chrome/Edge: 설치 없이 지원. iOS 16.4+: 홈화면 추가 필요 — MVP는 Android 우선.
- 근거: closed beta 대상 사용자에게 실시간 알림 경험을 검증하는 것이 이메일보다 제품 가치에 부합.

Amended — 2026-05-11

2026-05-11 amendment: email remains an optional deterministic dispatch path, but production email sending and scheduler proof are **not** a current SLC release gate. The core #52 closure criterion is in-app imminent injection emphasis; external reminder delivery is deferred unless stakeholders reclassify it as core.

## Context

`docs/01-product/original-note-hyunjoo.md` §5-2, §5-6, and §6-1 make missed medication/injection timing a core product risk: Fevio needs a first-release safety net for user-confirmed injection cards. ADR 0001 keeps P0 as a responsive webapp SLC, not a native app. ADR 0002 therefore split carrier fallback out of P0 and created:

- `N1` — in-app time emphasis plus one 30-minute reminder channel.
- `N8` / GitHub `#59` — choose the P0 reminder channel before `N1` implementation.

The options compared here are Web Push API + Service Worker, Email-only, and PWA install nudge. Kakao 알림톡, SMS, and native push remain P1++ / carrier-fallback scope.

## Decision

Choose **Email-only** as the optional off-tab reminder channel for `N1`, but do not let production email/scheduler proof block the SLC core care loop.

`N1` should implement:

- in-app critical time emphasis for confirmed injection cards, as already required by ADR 0002 Rule #25-A;
- optional one 30-minute-before reminder sent to the user's verified account email when scheduler/provider proof is explicitly in scope;
- a deterministic dispatch log keyed by card, scheduled time, and channel;
- Korean copy that includes only the confirmed card title, scheduled time, and app link;
- no medical advice, dosage inference, Kakao/SMS/native push, or LLM-generated reminder text.

Web Push API + Service Worker is deferred to P1 after the webapp has an explicit PWA/install strategy. PWA install nudge alone is not selected as the P0 reminder channel because it does not deliver a reminder by itself.

## Option comparison

| Option | Infra cost | iOS Safari support | Consent flow | Delivery reliability | SLC release-gate impact |
| --- | --- | --- | --- | --- | --- |
| Web Push API + Service Worker | Medium/high: service worker, VAPID/subscription storage, retry/error paths, subscription churn, browser-specific QA. | Partial for this SLC: Apple supports Web Push on iOS/iPadOS only for web apps saved to the Home Screen on iOS 16.4+; normal Safari tab use cannot be assumed. | High-friction: user must install/add to Home Screen on iOS, then grant notification permission from a user gesture. Permission denial is sticky and needs recovery UI. | Good when installed and granted, but brittle for first-time mobile web users because install + permission + subscription state must all hold. | Too high: adds PWA manifest/install QA and push subscription lifecycle to a release gate that should prove the manual-first care loop. |
| Email-only | Low/medium: Supabase scheduled/edge function plus one transactional mail provider and dispatch log. No browser subscription state. | Broad: works for iOS Safari users because it relies on the verified account email, not browser push capability. | Lower-friction: explicit reminder email toggle/notice during onboarding or card confirmation; no OS/browser notification prompt required for P0. | Adequate P0 baseline: delivery is not instant-guaranteed and can land in spam, but transactional email has observable provider status and works when the app tab is closed. | Acceptable: adds one provider secret and one email template, while preserving ADR 0001's webapp-first SLC. |
| PWA install nudge | Low by itself: manifest/icon/install education UI. Medium if paired with push. | Installability exists on iOS, but install UX is manual and browser-specific; it does not itself enable a reminder unless paired with Web Push and permission. | Medium/high: requires teaching the user to install before any reminder benefit; if paired with push, still requires notification consent. | Low as a standalone channel: a nudge cannot deliver time-sensitive reminders. | Poor as a P0 gate: useful later as adoption UX, but it would block `N1` without satisfying the reminder requirement. |

## Consequences

Easier:

- `N1` can proceed without making P0 depend on PWA install behavior, Service Worker push support, Kakao/SMS contracts, or native app release.
- The release gate remains aligned with ADR 0001: responsive webapp + Supabase-backed deterministic flow.
- Reminder dispatch can be tested with server-side integration tests and provider stubs without making production email a release blocker.

Harder:

- Email is not a guaranteed immediate alert channel; users may have delayed inbox checks, spam filtering, or muted mail notifications.
- The product must set expectations: P0 email is a minimum reminder, not an emergency/medical safety guarantee.
- A transactional email provider, sending-domain setup, and scheduler proof are required only when email is re-scoped as a core delivery feature.

Forbidden / deferred:

- Do not implement Web Push, PWA install prompts, Kakao 알림톡, SMS, native push, or sending code in ADR 0004.
- Do not describe email as sufficient medical safety coverage.
- Do not include raw clinic memo text, inferred dosage, or unconfirmed LLM output in reminder email copy.
- Do not block P0 closure if provider/scheduler setup is delayed or de-scoped; keep ADR 0002's fallback rule: release in-app emphasis first and treat email provider/scheduler work as optional expansion.

## Evidence references

- Apple Developer Documentation — Web Push for Safari/web apps: <https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers>
- Safari 16.4 Release Notes — Web Push added for iOS Home Screen web apps: <https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes>
- MDN Push API — Push requires an active Service Worker and subscription: <https://developer.mozilla.org/en-US/docs/Web/API/Push_API>
- MDN Notifications API — notification permission should be requested from a user gesture and mobile should use Service Worker notifications: <https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API>

## Related

- Issue: `#59` / `N8`
- Unblocked issue: `N1` / `#52`
- ADR 0001 — `docs/04-decisions/0001-slc-first-manual-first.md`
- ADR 0002 — `docs/04-decisions/0002-p0-boost-rules.md`
