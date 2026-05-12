# Cinematic Care Surface Direction

**Date:** 2026-05-11 KST  
**Scope:** Fevio product home and `/demo` visual convergence for issues #88 and #101.

## Intent

Fevio should feel like a calm care surface, not a boxed dashboard. Visual depth is allowed only when it makes the next safe action and partner role easier to understand.

## Architecture philosophy

Fevio's cinematic surface is semi-generative: context changes the chosen component, copy, visual tone, and input module, but only inside fixed safety slots. This makes the UI feel personal without allowing arbitrary AI-created medical screens.

> Fevio projects confirmed care context into strict layout slots, verified components, restrained copy templates, and partner-role translations.

## Rules

1. **Confirmed data first.** Cinematic surfaces may highlight confirmed cards, care-day type, count, and partner-visible status. They must not invent treatment progress, dosage, diagnosis, or prognosis.
2. **Input causes adaptation.** The UI should show a small input moment and the resulting adaptation: “this memo/situation changed today’s screen and partner role.”
3. **One visual focus per state.** Injection day emphasizes timing and preparation; clinic day emphasizes checklist flow; waiting day emphasizes low-noise calm.
4. **Shared language, separate trees.** `/demo` can remain presentation-specific, but stable patterns should match the product home: soft depth, sage/cream base, lavender support, coral urgency, large touch targets.
5. **Partner clarity.** Partner surfaces should answer “what should I do now?” and “what should I avoid?” without exposing raw clinic notes.

## Current bridge

- `/demo` uses data-driven 내 화면/파트너 panels and now includes an explicit input-to-adaptation card for each treatment situation.
- `AdaptiveHomeRuntime` injection day uses a stronger care summary surface based on confirmed cards and keeps the utility/action cards visible below it.

## Non-goals

- No new database fields for theatrical progress.
- No medical recommendation or inferred treatment safety judgment.
- No forced merge of demo component trees into product home before product states reach parity.
