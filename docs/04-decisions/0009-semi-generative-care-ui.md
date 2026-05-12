# ADR 0009 — Semi-generative Care UI inside fixed safety slots

## Status

Accepted — 2026-05-12

## Context

Fevio handles sensitive IVF information and the user's emotional load at the same time. A fully generative UI, where AI invents the whole screen, would weaken medical safety, accessibility, QA reproducibility, and brand consistency.

The product still needs to feel personal and cinematic. The right architecture is therefore semi-generative: AI and domain logic may choose the best predesigned component, copy template, visual tone, and input module for the current care context, but they may not invent layout, medical facts, dosage, prognosis, or partner-visible scope.

## Decision

Fevio adopts a **Semi-generative Care OS** architecture:

> Fevio does not let AI draw arbitrary medical screens. It projects confirmed care context into strict layout slots, verified components, restrained copy templates, and partner-role translations.

The architecture has four allowed projection lanes:

1. **Intent-based component projection** — clinic notes and user input are classified into intents, then rendered through existing widgets such as medication, schedule, clinic-briefing, record, or partner-action cards.
2. **Contextual editorial copy** — copy is selected from approved Korean-first templates and interpolated with confirmed user/context values. The system may soften tone; it may not invent facts.
3. **Adaptive visual orchestration** — care phase controls palette, density, motion, and emphasis. Injection can be clearer and more action-forward; clinic can be briefing-oriented; waiting can be calmer and lower-noise.
4. **Progressive micro-interviews** — onboarding and capture flows reveal only the next necessary input module based on the previous answer.

## Safety constraints

- **Strict layout slots.** AI cannot freely place UI. Text, action, detail, partner, and confirmation regions are predefined.
- **Backdrop scrim and readability.** Any cinematic background must preserve text contrast through tokenized scrim/blur rules.
- **No hallucinated medical actions.** Drug names, dosage, times, milestones, procedure dates, and risk levels must come from user-confirmed input, clinic records, or deterministic rules.
- **Confirmation before activation.** Extracted medical content starts as a draft and requires user confirmation before reminders, completion state, or partner projection.
- **Partner translation boundary.** The partner view receives role/action guidance, not raw clinic text, raw emotions, prognosis, or private notes.

## Differentiation

Most fertility apps act as calendars, trackers, static content libraries, or generic chat surfaces. Fevio's differentiation is a state-based care surface that assembles the right screen from the couple's confirmed treatment context:

- not a calendar: it decides what matters today;
- not a chatbot: it uses deterministic components and confirmation gates;
- not a medical advice engine: it never invents clinical judgment;
- not a wellness app: it translates IVF operations into shared roles;
- not a generic dashboard: each phase gets a distinct composition, tone, and partner action model.

## Consequences

### Easier

- Presentation and product language can explain Fevio as an adaptive care surface, not a loose AI app.
- QA can test deterministic components, layout slots, and forbidden-copy patterns.
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
