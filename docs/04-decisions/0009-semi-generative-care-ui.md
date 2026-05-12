# ADR 0009 — Semi-generative Care Surface via TPO specificity-first rules

## Status

Accepted — 2026-05-12

## Context

Fevio handles sensitive IVF information and the user's emotional load at the same time. A fully generative UI, where AI invents the whole screen, would weaken medical safety, accessibility, QA reproducibility, and brand consistency.

The product still needs to feel personal and cinematic. The right architecture is therefore semi-generative: domain logic may choose the best predesigned component, copy template, visual tone, and input module for the current care context, but it may not invent layout, medical facts, dosage, prognosis, or partner-visible scope.

TreatmentTimeline now provides milestone-first care context, including `phaseCareDay`, `surfaceCareDay`, `overrideReason`, and reserved proximity information. Semi-generative rules sit on top of that confirmed context.

## Decision

Fevio adopts a **Semi-generative Care OS** architecture:

> Fevio does not let AI draw arbitrary medical screens. It projects confirmed care context into strict layout slots, verified components, restrained copy templates, and partner-role translations.

The implementation decision is:

**TPO specificity-first slot selection + Zod-validated JSON config.**

- Rule evaluation uses TPO specificity-first selection, not cumulative scoring.
- Rules are stored in `config/care-surface-rules.json` and validated at build/runtime import through `CareSurfaceRuleSchema`.
- Each rule can affect one fixed slot only: `hero`, `primary_card`, `secondary_card`, `stats_row`, `checklist`, or `partner`.
- Slots select from approved components only: `CareMomentRing`, `CompactHeroGreeting`, `MissionCardPair`, `QuickStatRow`, `QuietChecklist`, `PartnerConnectBar`, or `null` for suppression.
- Visual modulation flows through `--fevio-surface-intensity` from `0.0` quiet to `1.0` critical.
- Partner rendering receives only `PartnerSurfaceSignal`, never raw treatment or rule context.

## Why specificity-first, not cumulative score

Cumulative scoring can create unexpected medical UX interactions: two weak signals might accidentally produce a high-urgency surface. IVF care screens must be predictable. Specificity-first means the most context-specific matching rule wins per slot; if specificity ties, lower numeric priority wins.

Rejected alternatives:

- **MODU-style cumulative score** — rejected because medical UX cannot let unrelated rules combine into accidental urgency.
- **Database-stored rules in v1** — rejected because it expands operational risk and makes QA less reproducible.
- **Fully generative layout** — rejected because it weakens medical safety, accessibility, and partner privacy.
- **emotionTrend active questioning** — rejected permanently for v1 because “오늘 컨디션 어때요?” style prompts increase burden for tired patients.
- **A/B testing in v1** — rejected because this surface needs deterministic safety before experimentation.

## v1 scope

v1 implements B+C only:

1. **Event proximity / override adaptation**
   - `overrideReason=trigger_shot` can put `CareMomentRing` into the hero slot and set intensity to `1.0`.
   - Future proximity rules may use `proximityDays`, but only after fixtures and QA gates are added.

2. **No-card fallback**
   - `cardCount=0` suppresses the `primary_card` slot and sets quiet intensity to `0.15`.

3. **Waiting quiet state**
   - `careDay=waiting_day` keeps `CompactHeroGreeting` with low intensity `0.2`.

## Type contracts

```ts
type CareSurfaceSlot =
  | 'hero'
  | 'primary_card'
  | 'secondary_card'
  | 'stats_row'
  | 'checklist'
  | 'partner';

type CareSurfaceComponent =
  | 'CareMomentRing'
  | 'CompactHeroGreeting'
  | 'MissionCardPair'
  | 'QuickStatRow'
  | 'QuietChecklist'
  | 'PartnerConnectBar'
  | null;

interface FevioSurfaceContext {
  careDay: TimelineCareDay;
  overrideReason?: CareSurfaceOverrideReason;
  proximityDays?: number;
  emotionTrend?: 'declining' | 'stable' | 'rising'; // reserved; v1 always undefined
  cardCount: number;
  partnerStatus?: 'connected' | 'seen' | 'unknown';
}

interface PartnerSurfaceSignal {
  urgencyTier: 'critical' | 'elevated' | 'routine' | 'quiet';
  intensity: number;
  phase: 'injection' | 'clinic' | 'waiting' | 'routine';
  momentCopy: string;
}
```

`PartnerSurfaceSignal` must not include `overrideReason`, `proximityDays`, milestone names, drug names, raw clinic text, prognosis, or private notes.

## CSS intensity contract

`--fevio-surface-intensity` is a behavioral visual signal, not decoration.

| intensity | Meaning | Visual behavior |
|---|---|---|
| `1.0` | critical time gate | strongest bloom, stronger depth, still static |
| `0.65` | elevated care action | medium bloom/depth |
| `0.2` | waiting/quiet | low bloom, softer grain |
| `0.15` | no confirmed cards | near-neutral quiet surface |

Motion is not required. `prefers-reduced-motion` must remain respected because intensity changes are static CSS values.

## Trace and transparency

- v1 exposes developer-only DOM attributes such as `data-intensity`, `data-applied-rules`, and `data-override-reason`.
- `userExplanation` is reserved in JSON rules for v2 transparency UI.
- v1 must not show rule IDs or raw rule causes to users.

## Future extension path

Allowed only after tests and fixtures exist:

- passive `emotionTrend` inference, not active “how are you?” questioning;
- database-backed rule storage with migration, admin review, and rollback;
- `userExplanation` UI in restrained Korean copy;
- additional `proximityDays` rules from TreatmentTimeline;
- experiment framework only after deterministic safety gates pass.

## Consequences

### Easier

- Presentation and product language can explain Fevio as an adaptive care surface, not a loose AI app.
- QA can test deterministic components, layout slots, forbidden-copy patterns, and data attributes.
- Designers can evolve cinematic surfaces without giving up medical safety.
- Partner UX stays privacy-preserving because projection is role-based.

### Harder

- Every new projection lane needs fixtures, copy rules, and negative tests.
- Generative copy must be constrained to approved templates or reviewed outputs.
- Visual experimentation must pass readability and slot-fit checks.

### Forbidden

- Do not ship a screen where AI creates arbitrary layout or partner-visible medical content.
- Do not let model-generated copy change dosage, time, diagnosis, prognosis, or urgency.
- Do not replace explicit user confirmation with inferred clinical certainty.
- Do not use cinematic imagery if it reduces action clarity or Korean text readability.
