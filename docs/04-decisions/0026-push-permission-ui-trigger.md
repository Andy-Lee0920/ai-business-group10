# ADR 0026 — Push permission UI trigger is an inline home CTA

## Status

Accepted — 2026-05-28

## Context

ADR 0004 moved MVP reminders to PWA web push, while preserving the product rule that Fevio is a calm care-operation support app and not an emergency or medical-device channel. Browser notification permission is high-friction and sticky after denial. It also has platform-specific constraints: iOS Safari can only receive Home Screen web app push after the user adds the app to the Home Screen on supported iOS versions.

The #377 PWA infrastructure is already in place: manifest, service worker, `push_subscriptions`, authenticated subscribe route, VAPID env names, and production prerequisite smoke. #421 closes the remaining UX trigger gap: permission must be requested only from a clear user gesture, never from mount or a passive effect.

## Options Compared

| Option | Shape | Benefit | Rejected because |
| --- | --- | --- | --- |
| Auto prompt on component mount | Call `Notification.requestPermission` from home mount or `useEffect`. | Fastest path to a browser prompt. | Violates browser UX expectations, creates surprise prompts during a sensitive care moment, and makes denial more likely. |
| Injection-day only prompt | Show permission request only when an injection card is imminent. | Trigger is tied to high-value reminder need. | Too late and too narrow; users may need setup before the critical window, and non-injection medication reminders still matter. |
| After confirm flow | Request permission immediately after a care card is confirmed. | User has just created reminder-eligible data. | Confirmation is for medical/task meaning, not browser permission; adding the prompt there expands onboarding/confirm friction. |
| Inline CTA on Home reminder control | Home shows a small explicit notification CTA; request happens only after the user clicks it. | Keeps permission opt-in, reversible, testable, and close to the reminder utility. | Accepted. |

## Decision

Use the Home reminder inline CTA as the only accepted push permission trigger for #421.

Rules:

1. `Notification.requestPermission` may run only from the CTA click path.
2. Component mount, render, route entry, and `useEffect` must not call permission request.
3. Permission denial is remembered locally so a same-page retry does not re-prompt while the browser remains denied or undecided.
4. iPhone/iPad Safari when not installed as a Home Screen web app must not call permission request. It shows one line of guidance: "iPhone 알림은 홈 화면에 추가한 뒤 켤 수 있어요".
5. Full iOS install guide UI is out of this slice and belongs in a child issue if needed.

## Consequences

### Easier

- The permission request is user-gesture-only and can be proven with unit and Playwright tests.
- Denial recovery is quiet; Fevio does not nag in the same session.
- Home owns reminder utility setup without adding permission friction to onboarding or confirmation.

### Harder

- Users may ignore the CTA and remain unsubscribed until they intentionally enable it.
- iOS Safari users need a separate install education path before live push receipt can be completed.
- Physical Android/iOS notification receipt evidence remains tracked outside this ADR in the live-device issues.

## Prohibited

- Calling `Notification.requestPermission` from component mount, render, `useEffect`, or a background task.
- Forcing push permission inside onboarding, capture, or confirm flows.
- Treating iOS Safari tab usage as push-capable without Home Screen installation.
- Storing clinic memo, dosage, diagnosis, partner token, or other sensitive care payload in push subscription rows or browser notification setup.

## Related

- ADR 0004 — PWA web push is the MVP reminder channel.
- ADR 0006 — In-app fallback remains non-alarming and deterministic.
- ADR 0013 — Confirmed care action cards are the executable reminder spine.
- Issue #377 — PWA push infrastructure parent.
- Issue #421 — Inline CTA + iOS non-installed guard closure slice.
- Issues #382/#383 — Physical Android/iOS live push evidence.
