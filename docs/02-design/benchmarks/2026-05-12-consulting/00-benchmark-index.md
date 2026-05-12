# Fevio benchmark execution index

This folder turns the 2026-05-12 consulting benchmark images into implementation contracts.

## Read order for Codex / implementation agents

1. `01-screen-contracts.md` — required screen contracts for patient/partner by phase.
2. `02-gold-payloads.json` — deterministic payload examples for every contract.
3. `03-design-tokens.md` — visual constants to preserve the benchmark hierarchy without copying pixels.
4. `04-acceptance-criteria.md` — PR and URL verification gates.
5. `05-do-not-copy-but-preserve.md` — literal-copy guardrails.
6. `README.md` — benchmark image index.

## Primary rule

Do not copy benchmark pixels. Preserve the hierarchy:

- dominant object,
- first-fold content,
- CTA count,
- scroll boundary,
- emotional tone,
- forbidden patterns.

If phases share the same component order, the implementation fails even if colors, icons, and copy differ.

## Related issues

- #135 — icon system must support comprehension, not decoration.
- #138 — usefulness gate.
- #139 — layout matrix: data chooses the layout variant.
- #140 — ClinicDay doctor-trust briefing.
- #141 — phase-distinct layout composition.
- #142 — bespoke visual asset kit.
