# Product documents

This folder keeps the product narrative and implementation contract together.

## Reading order

1. `fevio-product-north-star.md` — **production North Star**: same app, shared state, different experience; governed state-driven utility UI, not static mock screens.
2. `original-note-hyunjoo.md` — **highest-priority product origin**: IVF treatment is complex, emotionally loaded, and often managed by one person even though it affects a couple.
3. `prd-v1.0.md` — the implementation-ready PRD after the final decision pass.
4. `slc-target.md` — the first Simple, Lovable, Complete webapp loop to prove before broadening scope.

## Important interpretation

The SLC and PRD do **not** replace the original product vision. They narrow the first build so the team can prove one complete loop:

```text
clinic instruction → user-confirmed action cards → dynamic home → partner action view
```

Longer-term product axes from the original note remain valid context:

- irregular clinic schedule management;
- medication/injection timing and reminders;
- couple information sharing and role clarity;
- emotional load reduction;
- IVF journey records;
- stronger notification fallback;
- sensitive medical-data security and deletion policy.

If a future issue expands or changes the product, it should explicitly name which original axis it is preserving or reviving and what safety/privacy tests protect it. If there is tension, preserve the meaning of `original-note-hyunjoo.md` and narrow only the implementation scope.
