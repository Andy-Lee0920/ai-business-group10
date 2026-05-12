# Do not copy pixels. Preserve hierarchy.

The benchmark images are not a visual cloning target.

## Do not copy

- exact pixels,
- exact typography shapes,
- exact illustration style,
- exact slide layout,
- local image artifacts or annotations,
- any generated-image imperfections.

## Must preserve

- first visible object,
- dominant information,
- CTA count,
- scroll boundary,
- phase-specific center of gravity,
- partner role translation,
- emotional tone.

## Translation examples

### InjectionDay

Do not copy the exact ring pixels.

Do preserve:

- ring/time dominates first fold;
- time is larger than explanatory text;
- one CTA;
- facts and partner role appear after the main instrument.

### ClinicDay

Do not copy the exact clinic mockup.

Do preserve:

- the screen reads as a context-review document;
- questions and recent care summary are first-class;
- partner is a companion/logistics role;
- capture affordance exists for next hospital instruction.

### WaitingDay

Do not copy exact purple backgrounds.

Do preserve:

- whitespace is the main intervention;
- one quiet sentence is central;
- partner guidance reduces pressure;
- the UI avoids making waiting feel like more work.

## Codex prompt snippet

Before implementing an issue that touches adaptive home, demo, partner, icons, or assets, read:

`docs/02-design/benchmarks/2026-05-12-consulting/01-screen-contracts.md`

Do not copy benchmark pixels. Preserve the hierarchy: dominant object, first-fold content, CTA count, scroll boundary, and forbidden patterns.

This PR fails if:

- phases share the same component order;
- only color/copy/icon changes;
- first fold contains dense cards;
- partner screen mirrors raw patient data;
- no deployed URL demonstrates the expected role/action/result.
