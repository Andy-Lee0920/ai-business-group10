# Fevio Care OS Architecture Scorecard

This scorecard converts the 2026-05-12 architecture advisory images into implementation-grade grading criteria. The metric is not issue count; it is whether Fevio proves: **Same app. Shared state. Different experience.**

Current baseline: 54 / 100
Next target: 80 / 100

## Scoring matrix

| Area | Points | Current | Pass condition | URL Green condition |
|---|---:|---:|---|---|
| Shared Care State Foundation | 10 | 8 | Patient and Partner resolve to the same care cycle state with role-specific membership. | `/home` and `/partner/[token]` show the same cycle day but different role surfaces. |
| Semi-Generative UI Engine | 15 | 12 | Confirmed care context selects approved slots/components through deterministic rules. | `/home` trigger-shot state shows `CareMomentRing` and `data-intensity="1.00"`. |
| Role-aware Patient/Partner Translation | 15 | 10 | Same care state is translated into patient action language and partner assist language. | Patient sees “내가 확인할 시간”; partner sees “내가 도울 역할”. |
| Partner Assist Operator Model | 12 | 5 | Partner can read/support/assist, but cannot edit medical data. | Partner URL has assist actions but no dosage/prescription edit affordance. |
| Patient-owned Sharing Scope | 12 | 3 | Patient controls Basic / Care / Emotional partner projection scope. | Lowering scope to Basic removes medication/emotion/memo detail from partner URL. |
| InjectionLog Trust Ledger | 12 | 2 | Injection completion records who administered, who recorded, and patient confirmation. | Partner records injection; patient sees “파트너가 기록했어요. 확인할까요?” before final completion. |
| Role-based Onboarding | 8 | 2 | Onboarding role answer changes the first-fold home intent. | Selecting partner/together changes `/home` from patient mission first to assist/share first. |
| Live Sync Proof | 8 | 5 | Valid partner token reflects patient-side changes within 30 seconds. | Production smoke updates a patient card and partner URL changes within 30 seconds. |
| Safety / Privacy Boundary | 8 | 7 | Partner projections never leak raw clinical notes, private fields, or rule internals. | Raw forbidden terms count is 0 on partner URL and partner surface API. |

## Closure rule

An architecture issue can close only when its Green condition includes:

1. URL or public interface under test;
2. user role;
3. action taken;
4. expected result;
5. negative condition proving raw/unsafe behavior is absent.

## Current interpretation

The closed Semi-Generative Care Surface package covers the engine and privacy boundary well, but does not complete the operation model. The remaining score gap is mostly in patient-owned sharing, partner permission, injection trust logging, and valid live-sync proof.
