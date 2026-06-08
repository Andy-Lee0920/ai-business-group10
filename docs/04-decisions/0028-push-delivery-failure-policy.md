# ADR 0028 — Push delivery failures are logged, not retried immediately

## Status

Accepted — 2026-05-28

## Context

ADR 0004 makes PWA Web Push the MVP reminder channel, and ADR 0026 requires push permission to stay behind a user-clicked Home CTA. That leaves a delivery lifecycle gap: a browser push endpoint can silently stop working after permission, browser, profile, or device changes. The user may believe reminders are still active even when the upstream push service now rejects the subscription.

Fevio is not a medical-device channel and must not treat provider failures as emergency states. The product still needs a calm recovery path: failed delivery should become observable for operations, stale subscriptions should leave the candidate pool, and the patient should have a visible way to reconnect notifications without exposing private care data.

## Options Compared

| Option | Shape | Benefit | Rejected because |
| --- | --- | --- | --- |
| Best-effort send only | Attempt Web Push and ignore provider failures. | Smallest implementation. | Leaves silent failure invisible and keeps dead endpoints in future dispatch candidates. |
| Convert failures to in-app urgency | Map push failures into ADR 0006 `needs_recheck` copy. | Uses an existing visible fallback surface. | Confuses external delivery failure with care-card completion state and risks making the home copy feel alarming. |
| Scheduled subscription health check | Periodically probe subscriptions outside reminder windows. | Could detect dead endpoints before a reminder is due. | Adds background traffic, policy surface, and false confidence; browsers do not provide a safe generic push reachability probe. |
| Log failure, revoke stale subscription, and show re-subscribe CTA | Record `failed_at` and a non-PII `failure_reason`; set `push_subscriptions.revoked_at` for 404/410; exclude revoked rows from candidates; show Home re-subscribe CTA when no active subscription remains. | Makes failures observable, avoids repeated dead sends, and gives the user a low-pressure recovery path. | Accepted. |

## Decision

Use the log-and-recover policy for #424.

Rules:

1. A Web Push `404` or `410` response means the subscription is no longer usable. Set `push_subscriptions.revoked_at`, record `reminder_dispatches.failed_at`, and set `failure_reason = 'subscription_revoked'`.
2. A Web Push `5xx` response is a provider/service failure. Record `failed_at` and `failure_reason = 'push_service_5xx_<code>'`; do not revoke the subscription.
3. Other network failures record `failed_at` and `failure_reason = 'network_error_<code-or-kind>'`; do not revoke the subscription.
4. Do not enqueue an immediate retry. The next normal T-60 or T-15 window may attempt delivery if an active subscription remains.
5. Reminder candidate selection must exclude `push_subscriptions.revoked_at IS NOT NULL`.
6. Home may show `알림 다시 받기` only when the signed-in patient has no active push subscription rows.

## Consequences

### Easier

- Operators can distinguish stale subscriptions from push-service instability without storing endpoint or user identifiers in logs.
- Dead subscriptions stop repeating as candidates after the first 404/410.
- Users get one clear recovery action instead of invisible failure or alarming medical copy.

### Harder

- A transient provider outage may skip that reminder window because immediate retry is prohibited.
- Re-subscribe recovery depends on the browser returning a fresh subscription endpoint after the old one was revoked.
- Physical-device delivery proof remains a separate live push evidence concern.

## Prohibited

- Creating a retry queue or immediate retry worker for #424 failures.
- Logging user id, endpoint, raw subscription JSON, clinic memo, dosage, diagnosis, or other user-identifiable data for 404/410 failures.
- Reusing ADR 0006 `needs_recheck` as a push-provider failure state.
- Sending raw clinic text or unconfirmed medical detail in push payloads or failure telemetry.

## Related

- ADR 0004 — PWA Web Push is the MVP reminder channel.
- ADR 0006 — Reminder fallback stays in-app until carrier channels are approved.
- ADR 0013 — Confirmed care action cards are the executable reminder spine.
- ADR 0026 — Push permission UI trigger is an inline home CTA.
- Issue #424 — Push delivery failure handling and re-subscribe CTA.
