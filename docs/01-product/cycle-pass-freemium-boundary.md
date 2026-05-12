# Cycle Pass Freemium Boundary

Status: Draft / HITL provider decision required
Issue: #172

## Decision

Fevio starts B2C with a freemium model plus **Cycle 단위 unlock**. IVF treatment is time-bounded, so a permanent subscription is less natural than unlocking one active cycle.

## Free core

기본 리마인더, 약물 카드, 파트너 연결은 무료. These functions protect execution safety and should not be held behind a paywall.

Free includes:

- medication and injection cards;
- routine reminders;
- partner connection and basic partner role surface;
- Quick Capture / manual confirmation flow;
- Result Protection Mode.

## Cycle Pass candidates

Cycle Pass may unlock deeper, non-safety-critical surfaces:

- ClinicDay deep history and richer visual recap;
- cycle timeline export;
- 2WW partner emotional support mode;
- longer cycle review archive after the user opens it.

## Non-negotiable exception

**Result Protection Mode is always free.** A negative result must never trigger a paywall, upsell, subscription check, promotional gate, or “unlock to review what happened” moment.

## Provider decision

Provider decision: HITL. Payment provider, entitlement source, refunds, and hospital code redemption are deliberately deferred. Code should call the `isCyclePassActive()` stub and keep provider assumptions out of product logic until this decision is made.

## Presentation rationale

Fevio monetizes convenience and continuity, not acute vulnerability. The free tier protects basic treatment execution; Cycle Pass unlocks richer cycle-level reflection and partner support during a bounded IVF cycle.
