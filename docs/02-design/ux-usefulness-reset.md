# UX Usefulness Reset

Status: Product-quality gate for #138.

## Three-second test

Every critical Fevio surface must answer three questions within three seconds:

1. What care moment is happening today?
2. What is the one safest next action?
3. What does my partner do without seeing raw medical or emotional data?

If a visual element does not improve situation, next action, partner role, or safety tone, it is decorative and should be removed or demoted.

## Screen-by-screen audit

| URL | Current pass/fail | Required dominant job | Verification |
|---|---|---|---|
| `/onboarding` | Pass with caution | Calm interview, not classification | One question at a time; no defensive negative phrasing |
| `/home?care=injection` | Pass | Time-sensitive preparation | Ring / time / one action before dense cards |
| `/home?care=clinic` | Pass after #139 | Clinic briefing | Briefing list appears before generic pulse/status |
| `/home?care=waiting` | Pass after #139 | Quiet support | Partner presence is low-pressure before checklist density |
| `/demo` | Pass | Role translation proof | Patient action changes partner role/action text |
| `/partner/demo` | Pass | Partner-safe help surface | Today role, help actions, avoid prompt; no raw sync internals |
| `/partner/[token]` | Pass from #126 | Real partner role surface | No `rev`, raw memo, or token data visible |

## Copy rewrite rules

- Do not use engineering labels: `Dynamic Home`, `signalGrid`, `LIVE SYNC`, `rev`.
- Do not use defensive negative phrasing such as “분류하려는 게 아니에요.”
- Do not imply surveillance, grading, or a correct answer.
- Prefer restrained warmth: name the situation, validate burden, then offer one action.

## Component judgment

- Useful: Care Moment Ring, phase-distinct briefing surface, partner role pulse, capture affordance, quiet checklist.
- Decorative unless tied to a job: generic badges, cute avatars, broad stat grids, repeated glass cards, icons without action meaning.
- Harmful: raw mirrored patient data, emotion scores, sync revisions, internal tokens, medical instructions not confirmed by the clinic.

## Child ticket gate

All child UX tickets must include:

```txt
Green condition:
Visit [URL]. [User role] performs [behavior]. Expected: [observable care outcome].
```

The PR fails if it only adds prettier components without changing comprehension, action, partner role, or safety tone.
