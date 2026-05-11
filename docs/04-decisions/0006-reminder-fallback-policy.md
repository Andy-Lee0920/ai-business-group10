# ADR 0006 — Reminder fallback stays in-app until carrier channels are approved

## Status

Accepted — 2026-05-11

## Context

Fevio must not pretend that web reminders are medical emergency coverage. The core product need in #49 is that a user can see when an important injection or medication card has not been confirmed after its scheduled time. Carrier channels such as Kakao/SMS/native push add cost, consent, legal review, sender verification, and delivery failure states that are outside the current core slice.

## Decision

For the current P1 closure, reminder fallback means an **in-app recheck state**:

- A confirmed, user-marked-important injection or medication card becomes `needs_recheck` when its scheduled time is more than 15 minutes in the past and the card is still not completed.
- The visible copy is restrained: “아직 확인 안 됐어요 · 조용히 다시 확인해 주세요.”
- The copy must not say emergency, failure, cancellation, danger, or medical warning.
- The state is computed from user-confirmed `scheduled_at`, `card_type`, `status`, and `user_marked_important`; it is not a medical judgment and is not persisted as a diagnosis.

## Deferred channels

Kakao 알림톡, SMS, native push, and production email scheduler/provider proof remain deferred expansion work. They require explicit cost, consent, sender identity, retry, audit, and legal/privacy review before implementation.

## Test contract

- Unit: missed important injection card produces `needs_recheck` and in-app copy.
- Unit: completed cards and non-important cards do not produce recheck copy.
- Home composition: recheck copy appears through the same visible card path as urgent time copy.
