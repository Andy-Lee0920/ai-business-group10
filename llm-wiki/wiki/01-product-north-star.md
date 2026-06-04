# 01 Product North Star

Fevio is a care-operation support webapp for IVF patients and couples. Its job is to turn clinic instructions into confirmed care actions, then reshape the home screen around today's care context.

## What Fevio Is

- A calm operational layer for clinic instructions.
- A confirmation-first system for medication, injection, clinic visit, record, and partner support actions.
- A role-aware interface that gives the primary user and partner different utility views.
- A privacy-first product where sensitive care data is written only after explicit boundary acceptance.
- A mobile-first Korean-first experience.

## What Fevio Is Not

- Not a diagnosis tool.
- Not a treatment planner.
- Not a dosage advisor.
- Not a medical-device substitute.
- Not a static dashboard or generic schedule app.
- Not an AI system that decides ownership, priority, treatment safety, or medication timing.

## North Star Loop

The product should strengthen this loop:

```text
Clinic instruction -> user-confirmed care card -> today's care context -> dynamic home -> partner-safe projection
```

If a feature does not improve this loop, it should remain outside P0 unless explicitly accepted as a separate slice.

## Home Storyline

The home screen is not a card grid by default. It should express today's care state first, then expose the next safe operational action.

Good home behavior:

- First login before capture feels like onboarding.
- Injection day foregrounds the next confirmed timing action.
- Clinic day foregrounds what to bring, ask, confirm, or avoid.
- Waiting day stays calm and low-density.
- Partner prompts are useful without exposing raw private context.

## Product Tone

Fevio should feel calm, precise, warm, partner-aware, and practical. Avoid cute reassurance, emotional overreach, medical-test language, and internal product terms.

