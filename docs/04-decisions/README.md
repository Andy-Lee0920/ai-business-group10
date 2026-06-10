# Architecture Decision Records

ADRs record decisions that future contributors and coding agents should not casually relitigate.

Keep each ADR short:

```text
# ADR NNNN — Title

## Status
Accepted | Proposed | Superseded

## Context
Why this decision exists.

## Decision
What we chose.

## Consequences
What this makes easier, harder, or forbidden.
```

## Index

- [ADR 0001 — SLC-first, manual-first Fevio webapp](0001-slc-first-manual-first.md)
- [ADR 0002 — P0 boost rules for #25 / #27 / #49](0002-p0-boost-rules.md)
- [ADR 0003 — Schedule model stays on care action cards for SLC](0003-schedule-model.md)
- [ADR 0004 — P0 reminder channel is email-only](0004-reminder-channel.md)
- [ADR 0005: Input Mode Decision for v1](0005-input-mode-decision.md)
- [ADR 0006 — Reminder fallback stays in-app until carrier channels are approved](0006-reminder-fallback-policy.md)
- [ADR 0007 — Privacy delete and partner disconnect boundary](0007-privacy-delete-boundary.md)
- [ADR 0008 — TreatmentTimeline uses confirmed milestones before care-card fallback](0008-treatment-timeline-milestone-first.md)
- [ADR 0009 — State-driven Generative UI Care Surface via TPO specificity-first rules](0009-state-driven-generative-ui.md)
- [ADR 0010 — ClinicDay is a care-context review session, not an LLM doctor mediator](0010-clinicday-context-review-session.md)
- [ADR 0011 — CycleEvent state machine](0011-cycle-event-state-machine.md)
- [ADR 0012 — Result Protection Mode after negative beta](0012-result-protection-mode.md)
- [ADR 0013 — Confirm spine canonical: photo/OCR flow attaches to care_action_cards](0013-confirm-spine-canonical.md)
- [ADR 0014 — Medication reference image is deterministic mapping only](0014-medication-reference-image-deterministic.md)
- [ADR 0015 — Records tab entity model: couple journal + community split](0015-records-tab-entity-model.md)
- [ADR 0016 — Community identity & moderation policy](0016-community-identity-and-moderation.md)
- [ADR 0017 — Closed beta operational access exception](0017-closed-beta-operational-access.md)
- [ADR 0018 — MVP supersedes SLC; freeze SLC terminology for new work](0018-mvp-supersedes-slc.md)
- [ADR 0019 — Couple Journal partner-link activation gate](0019-couple-journal-partner-link-gate.md)
- [ADR 0020 — Community audience dual-scope (everyone + same_role)](0020-community-audience-dual-scope.md)
- [ADR 0021 — Daily Brief: closed-beta LLM exploration, production deterministic destination](0021-daily-brief-llm-exploration-deterministic-destination.md)
- [ADR 0022 — Brief × Execution priority renderer](0022-brief-execution-priority-renderer.md)
- [ADR 0023 — Partner Brief: separate contract, not primary projection](0023-partner-brief-separate-contract.md)
- [ADR 0024 — No mascot visual identity; botanical / abstract only](0024-no-mascot-visual-identity.md)
- [ADR 0025 — Brief Reflection Turn: ephemeral pull pattern; narrow ADR 0009 reject scope](0025-brief-reflection-turn-ephemeral-pull.md)
- [ADR 0026 — Push permission UI trigger is an inline home CTA](0026-push-permission-ui-trigger.md)
- [ADR 0029 — Confirm UI mandatory inline quote rule](0029-confirm-ui-mandatory-inline-quote-rule.md)
- [ADR 0030 — Surface Lifecycle: defer adoption, extend ADR 0009 instead of a parallel registry](0030-surface-lifecycle-defer-extend.md)
- [ADR 0031 — Manual clinic logging write bridge; migrate producer before consumer](0031-manual-logging-write-bridge-producer-first.md)
- [ADR 0032 — Concern triage architecture: stored signal tags, read-inline/write-route, LLM-as-classifier](0032-concern-triage-architecture.md)
