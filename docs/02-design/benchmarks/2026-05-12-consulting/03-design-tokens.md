# Benchmark-derived design tokens

These tokens preserve the benchmark hierarchy without copying pixels.

## Layout tokens

| Token | Value | Use |
|---|---:|---|
| Phone logical width | 440pt | iPhone 17 Pro Max design basis |
| Phone logical height | 956pt | Desktop frame internal screen |
| Safe top | 59px | Keep content aware of Dynamic Island, but allow hardware overlay behavior |
| Safe bottom | 34px | Home indicator area |
| Page horizontal padding | 24px | Default mobile content padding |
| Hero min-height, injection | 65–80vh of internal screen | Ring/time dominance |
| Hero min-height, clinic | 52–65vh of internal screen | Briefing document dominance |
| Hero min-height, waiting | 70–85vh of internal screen | Space dominance |
| Dense card gap | avoid above fold | Dense grid is forbidden above fold |

## Component density tokens

| Phase | First-fold max primary CTA | First-fold card count | Dominant object |
|---|---:|---:|---|
| Injection | 1 | 1–2 | Ring/time |
| Clinic | 1 | 1 context document | Numbered context review |
| Waiting | 0–1 | 0–1 | Whitespace/sentence |

## Visual tone tokens

| Phase | Palette role | Tone |
|---|---|---|
| Injection | coral/cream | time-sensitive but not alarming |
| Clinic | sage/mist | clinical trust, calm document |
| Waiting | lavender/dusk | quiet, low pressure |
| Partner | sage/lavender | role clarity and shared care |

## Elevation / material

- Use soft cards only when they group action or context-review content.
- Do not stack many glass cards above fold.
- Grain/noise remains subtle: opacity 0.03–0.05.
- Ring uses SVG circle geometry only: `viewBox="0 0 240 240"`, `cx=120`, `cy=120`, `r=94`.

## Typography hierarchy

- Dominant object text can be very large only when it is the job: time, context title, or quiet sentence.
- Avoid generic labels as top visual hierarchy.
- Engineering copy is forbidden.
