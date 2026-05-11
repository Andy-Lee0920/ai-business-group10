# ADR 0005: Input Mode Decision for v1

**Status:** Accepted  
**Issue:** #97  
**Date:** 2026-05-11 KST

## Decision

Fevio v1 uses a **quick structured entry first** model for safety-critical short inputs, with **capture-first entry** as the fallback for messy clinic instructions. Template-first entry is deferred to protocol/record flows where a known IVF pattern can reduce typing without auto-confirming medical meaning.

This is a convergence decision: every input surface must prove a short path from **one-screen input → explicit user confirmation → persisted confirmed care card → adaptive home/partner projection** before new input surfaces are added.

## Candidate comparison

| Mode | Best fit | Burden reduction | Risk |
|---|---|---|---|
| Quick structured entry | Schedule, medication/injection, onboarding first item, emotion check-in | one-screen chips, time picker, and short fields avoid database-form fatigue | Can become fragmented if every domain invents a separate form |
| Capture-first entry | Messy hospital memo, IVF record notes, protocol drafts | User pastes what they already have, then confirms only the actionable split | Must not turn draft text into executable cards without review |
| Template-first entry | Common IVF protocol/record patterns after v1 proof | Pre-filled structure can reduce repetitive typing | Highest risk of seeming like medical advice if templates auto-confirm details |

## v1 input mode matrix

| v1 input path | Primary mode | Fallback mode | Confirmation rule |
|---|---|---|---|
| Schedule add/change | Quick structured entry | Capture-first entry | Date, time, purpose, and cancellation/change status must be user-confirmed |
| Medication/injection | Quick structured entry | Capture-first entry | Name, dose, time, repeat, and importance must be typed or explicitly confirmed by the user |
| IVF treatment records | Capture-first entry | Template-first entry | Records stay notes/drafts until the user confirms what should become a card |
| Emotion check-in | Quick structured entry | Capture-first entry | Sharing is opt-in; emotion text never becomes partner-visible by default |
| Onboarding first setup | Quick structured entry | Capture-first entry | First schedule or medication item is confirmed before home adaptation |

## Low-burden rules

1. Prefer a one-screen input with chips, short fields, and one clear confirmation CTA.
2. Ask for the minimum needed to create a safe operational card; defer optional detail.
3. Let long clinic text enter through capture-first, then require review before cards exist.
4. Show the adaptation immediately after confirmation so the user sees why the input mattered.
5. Do not create new input surfaces unless they close one of the existing P0 loops.

## Never auto-confirm

Fevio must **never auto-confirm** medical or relationship-critical meaning. Medication names, doses, injection timing, ownership, and partner visibility must be explicitly selected, typed, or confirmed by the user before they become executable cards or partner-visible status.

The app may suggest structure, split lines, or raise attention cues. It must not decide treatment strategy, dosage, diagnosis, safety priority, or partner sharing on behalf of the user.

## Current vertical slice evidence

The first closed loop for this decision is medication/injection quick structured entry:

1. `/medication` shows the one-screen low-energy input.
2. The user selects type, enters name/dose/time/repeat, confirms dose, and marks importance.
3. `POST /api/medication` creates a capture shell, confirms exactly one card, decorates it with schedule/importance/partner visibility, and returns the card id.
4. The UI shows the confirmed card and can mark it complete through `POST /api/medication/complete`.
5. `scripts/verify-real-medication-e2e.mjs` proves this path against real Supabase using an authenticated disposable user, not the presentation mock path.

## Follow-up issue direction

- #91 Schedule Input: keep quick structured entry as the primary schedule path; capture-first remains fallback for pasted visit instructions.
- #92 Medication Input: keep quick structured entry as primary and preserve explicit dose confirmation as a hard gate.
- #93 Onboarding Input: keep one shared onboarding path with a quick first item; capture-first can handle users who only have a clinic memo.
