# Fevio Bespoke Visual Asset Kit

Status: Asset audit and follow-up slicing contract for #142.

## Decision

`lucide-react` is Tier 1: reliable utility icons for standard actions. It is not the full Fevio visual system. Bespoke assets are allowed only when they improve the three-second usefulness test.

## Tier rules

| Tier | Use when | Examples | Rejection rule |
|---|---|---|---|
| Tier 1 — Lucide icon | Standard action or status | syringe, pill, clock, check, share, radio, camera | reject if it becomes a decorative badge |
| Tier 2 — Fevio geometric SVG | Product-specific identity or care metaphor can be drawn from stable geometry | patient / partner / together anchors, briefing card, care handoff | shared viewBox, shared origin, consistent stroke; no freeform path by default |
| Tier 3 — Hand-crafted brand asset | A reusable brand moment cannot be expressed with geometry | future hero mark, campaign asset | requires explicit review before implementation |

## #135 icon-map audit

Sufficiently covered by lucide:

- Injection action: `Syringe`
- Medication action: `Pill`
- Clinic visit: `Building2`
- Clinic confirmation: `ClipboardCheck`
- Partner support: `Users`
- Record: `NotebookPen`
- Quiet waiting: `Leaf`
- Partner live signal: `Radio`
- Capture affordance: `Camera`

Not sufficiently covered by lucide:

- Patient / partner / together identity anchors.
- ClinicDay doctor-trust briefing visual.
- WaitingDay quiet presence field.
- Demo handoff visual that says “my state became partner-safe action.”

## Concrete bespoke assets

| Asset | Tier | Supports | Improves | Implementation slice |
|---|---:|---|---|---|
| Patient anchor | 2 | `/home`, `/partner/demo` | situation / identity | follow-up to #136 |
| Partner anchor | 2 | `/demo`, `/partner/[token]` | partner role | follow-up to #136 |
| Together care anchor | 2 | dual-view demo | partner role / safety tone | follow-up to #136 |
| Clinic briefing document glyph | 2 | #140 | next action / doctor trust | split after #140 implementation |
| Care handoff bridge | 2 | #137 | role translation proof | split after demo data is stable |
| Waiting quiet field | 2 | WaitingDay | safety tone | split after #141 layout work |

## Geometry constraints

- Prefer `circle`, `rect`, `line`, and `polyline`; avoid freehand `path`.
- When drawing radial instruments, every circle must share one origin.
- A bespoke SVG must declare a stable `viewBox`, stroke width, and semantic title.
- It fails review if it is cute, decorative, or only makes the UI look busier.
