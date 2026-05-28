# ADR 0008 — TreatmentTimeline uses confirmed milestones before care-card fallback

## Status

Accepted — 2026-05-12

## Context

The current `computeCareDay()` implementation derives the home phase from `care_action_cards.card_type`:

```ts
if (todayCards.some((card) => card.card_type === 'injection')) return 'injection_day';
if (todayCards.some((card) => card.card_type === 'clinic_visit')) return 'clinic_day';
```

That is a useful SLC fallback, but it reverses the domain direction for TreatmentTimeline. A care action card is an executable instruction; it is not the source of truth for the IVF phase. The conflict is common: after embryo transfer the user may still have progesterone injections. That routine injection should be foregrounded as a task, but the home mood and partner role should remain `waiting_day`.

The 2026-05-16 presentation remains on the existing presentation lane (`/demo` and `/home?care=`). This ADR is Post-SLC scope and must not destabilize the SLC release gate.

## Decision

Adopt a milestone-first TreatmentTimeline architecture:

```text
confirmed treatment_milestones
  → phaseCareDay  // treatment phase, home mood, partner role
  ↓ override only for confirmed time-gate cards
  → surfaceCareDay // actual home surface for today
  → foregroundCards // executable confirmed cards sorted for attention
```

The v2 public contract is:

```ts
type CareSurfaceContextV2 = {
  phaseCareDay: 'injection_day' | 'clinic_day' | 'waiting_day' | 'routine_day';
  surfaceCareDay: 'injection_day' | 'clinic_day' | 'waiting_day' | 'routine_day';
  foregroundCards: CareActionCard[];
  overrideReason: 'trigger_shot' | 'procedure_time_gate' | 'none';
};
```

`computeCareDay()` is deprecated for new TreatmentTimeline work. It remains as the SLC fallback until the v2 vertical slice is wired through `/home`.

## Override rules

Only user-confirmed time-gate cards may override the milestone-derived phase:

1. `trigger_shot` — confirmed trigger/final maturation shot instructions such as Ovidrel, Decapeptyl, or explicit trigger-shot wording. Surface becomes `injection_day`.
2. `procedure_time_gate` — confirmed retrieval/transfer/procedure time instructions. Surface becomes `clinic_day`.

General `card_type === 'injection'` is not enough to override phase. Progesterone/luteal support injections after transfer stay inside the `waiting_day` phase as foreground cards.

## Consequences

### Easier

- Treatment phase, partner role, and foreground task priority are no longer conflated.
- Waiting-day emotional design is preserved when routine medications/injections exist.
- The old card-only behavior remains available as fallback for users without milestones.

### Harder

- `/home` must eventually read both treatment milestones and care action cards.
- Tests must cover `phaseCareDay !== surfaceCareDay` and require an explicit override reason.
- Schema/RLS for `treatment_cycles` and `treatment_milestones` is required before real-lane adoption.

### Forbidden

- Do not let estimated milestones drive `surfaceCareDay`, partner-visible status, or critical priority.
- Do not infer treatment strategy, dosage, or medical recommendation from milestones.
- Do not remove `/home?care=` presentation routing before the 2026-05-16 demo window is over.
