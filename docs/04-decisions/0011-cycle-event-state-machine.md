# ADR 0011 — CycleEvent state machine

## Status
Accepted

## Context

TreatmentTimeline cannot be a date timer. IVF phase changes are irregular: stimulation can extend, retrieval can be cancelled, fresh transfer can switch to freeze-all, beta testing can require a repeat, and a negative result must enter Result Protection before next-cycle planning.

The previous milestone-only model is still useful as a presentation/SLC fallback, but it cannot be the canonical phase source for post-SLC care surfaces.

## Decision

Represent cycle progression as an append-only `CycleEvent` stream. The canonical phase is derived by a pure reducer:

```ts
reduceCycleState(events: CycleEvent[]): CyclePhaseState
```

The reducer returns three separate layers:

```ts
type CyclePhaseState = {
  predictedPhase: IvfPhase | null;   // date/template forecast only
  suggestedPhase: IvfPhase | null;   // clinic note or unconfirmed milestone suggestion
  confirmedPhase: IvfPhase;          // the only phase surfaces may use
  confidence: 'low' | 'medium' | 'high';
  evidence: PhaseEvidence[];
};
```

The rule is strict: home, partner, and notification surfaces read confirmedPhase only. `predictedPhase` and `suggestedPhase` can render as soft hints, never as canonical state.

## CycleEvent contract

`CycleEvent` is a discriminated union. Post-SLC implementation must include these 16 event types:

```ts
type CycleEvent =
  | { type: 'period_started'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'stimulation_started'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'follicle_scan_recorded'; date: string; noteId: string }
  | { type: 'trigger_scheduled'; date: string; time: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'retrieval_scheduled'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'retrieval_done'; date: string; oocyteCount?: number; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'retrieval_cancelled'; date: string; reason?: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'embryo_culture_started'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'freeze_all_decided'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'fresh_transfer_cancelled'; date: string; reason?: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'frozen_transfer_preparation_started'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'embryo_transfer_scheduled'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'embryo_transfer_done'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'beta_test_scheduled'; date: string; confirmedBy: 'user' | 'clinic_note' }
  | { type: 'beta_test_recorded'; date: string; resultStatus: 'pending' | 'repeat_needed' | 'positive' | 'negative'; hcgValue?: number }
  | { type: 'cycle_closed'; date: string; outcome: 'positive' | 'negative' | 'cancelled' | 'paused'; confirmedBy: 'user' | 'clinic_note' };
```

## Transition graph

Normal path:

```text
consultation
  → period_started
  → stimulation_started
  → follicle_scan_recorded
  → trigger_scheduled
  → retrieval_scheduled
  → retrieval_done
  → embryo_culture_started
  → embryo_transfer_done
  → beta_test_recorded: positive
  → ultrasound_wait
```

Exception paths:

```text
stimulation → retrieval_cancelled → cycle_cancelled | stimulation_extended
retrieval → fresh_transfer_cancelled → freeze_all
retrieval → freeze_all_decided → frozen_transfer_wait
frozen_transfer_preparation_started → embryo_transfer_done → two_week_wait
beta_test_recorded: negative → result_protection
beta_test_recorded: repeat_needed → beta_followup
cycle_closed: negative | cancelled | paused → closed_for_now
```

## Reducer rules

1. Sort events by event date and stable insertion order.
2. Confirmed events override predictions.
3. Cancellation events are terminal for the current branch until a later confirmed recovery/planning event exists.
4. `embryo_transfer_done` starts `two_week_wait` until beta result is recorded.
5. `beta_test_recorded: negative` enters `result_protection`, not `next_cycle_planning`.
6. `beta_test_recorded: repeat_needed` enters `beta_followup`.
7. The reducer is pure: it does not fetch clinic notes, mutate cards, or schedule notifications.
8. UI surfaces may show evidence, but they may not infer phase from care-action cards when a confirmed phase exists.

## Consequences

- IVF exceptional paths become first-class, testable state transitions.
- TreatmentTimeline can keep predictions without letting predictions mutate canonical care state.
- ClinicDay post-visit capture becomes high-quality evidence instead of a free-form note blob.
- 2WW and Result Protection can be modeled as explicit care states.
- Existing `computeCareDayV2()` remains a fallback until all surfaces migrate to `reduceCycleState()`.

### Consequences.Forbidden

- Automatic timer-only phase mutation.
- Card-type reverse inference as the canonical phase source.
- Rendering home, partner, or notification surfaces from `predictedPhase`.
- Moving from negative beta directly into next-cycle planning.
