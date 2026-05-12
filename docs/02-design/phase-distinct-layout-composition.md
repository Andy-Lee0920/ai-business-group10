# Phase-Distinct Layout Composition

Status: Execution brief for #141.

## Principle

A care phase is not a theme. A care phase is a different job. The dominant component must change by phase so a reviewer can identify injection, clinic, and waiting surfaces by silhouette before reading every line.

| Phase | Dominant object | Supporting objects | Demoted / forbidden |
|---|---|---|---|
| InjectionDay | Time ring / countdown / preparation urgency | confirmed injection card, preparation checklist, partner confirmer | generic text-first hero, dense briefing document |
| ClinicDay | Briefing checklist / doctor visit prep document | questions, recent care summary, partner companion, capture affordance | injection-style dominant ring, urgency countdown |
| WaitingDay | Whitespace / quiet sentence / low-pressure presence | max two required cards, quiet partner support | grids, progress dashboards, many CTA blocks |
| RoutineDay | Low-density summary | optional next item, capture entry | urgent surfaces, partner pressure |

## Component matrix

| Phase | Required | Optional | Demoted | Forbidden |
|---|---|---|---|---|
| InjectionDay | Care Moment Ring, one preparation action, quiet checklist | partner confirmer, utility launcher | broad summaries | generic stat grid above fold |
| ClinicDay | Briefing document, visit/question checklist, capture affordance | partner logistics pulse | atmospheric hero | shot countdown as main shape |
| WaitingDay | quiet sentence, partner presence, next required date | emotional check-in | checklist density | action-heavy dashboard |
| RoutineDay | next confirmed item, capture/update affordance | partner summary | phase drama | false urgency |

## Partner role by phase

- InjectionDay: `확인자` — time, supplies, completion check.
- ClinicDay: `동행자` / `기록 도우미` — logistics, notes, next instruction capture.
- WaitingDay: `곁에 있는 사람` — do not ask repeatedly, keep presence quiet.

## E2E guard

The same top five component test ids must not appear in the same order across all three phase URLs. A future implementation PR must capture mobile screenshots for `/home?care=injection`, `/home?care=clinic`, and `/home?care=waiting` and attach silhouette comparison evidence.

## Green condition

A reviewer can identify injection vs clinic vs waiting from layout silhouette alone within three seconds.
