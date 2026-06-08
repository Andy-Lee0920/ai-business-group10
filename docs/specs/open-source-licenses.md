# Open-source license and dependency notice baseline

Fevio's app repository is licensed under Apache License 2.0. See [`../../LICENSE`](../../LICENSE).

This page records the baseline used by #449 for contributor-facing license/compliance hygiene. It is not legal advice; maintainers should refresh it when dependencies change or before a public release package is cut.

## Project license

| Item | Decision |
|---|---|
| Repository license | Apache-2.0 |
| Copyright line | `Copyright 2026 Fevio contributors` |
| Scope | Source code and documentation in this app repository unless a file states otherwise |
| Contribution default | Contributions intentionally submitted to the project are under Apache-2.0 unless explicitly marked otherwise |

## Direct dependency notice

Extracted from `package.json` and `package-lock.json` on 2026-06-08.

| Package | Version | License |
|---|---:|---|
| `@anthropic-ai/sdk` | 0.100.1 | MIT |
| `@supabase/ssr` | 0.10.3 | MIT |
| `@supabase/supabase-js` | 2.105.4 | MIT |
| `lucide-react` | 1.14.0 | ISC |
| `next` | 16.2.6 | MIT |
| `react` | 19.2.6 | MIT |
| `react-day-picker` | 9.14.0 | MIT |
| `react-dom` | 19.2.6 | MIT |
| `swr` | 2.4.1 | MIT |
| `web-push` | 3.6.7 | MPL-2.0 |
| `zod` | 4.4.3 | MIT |

## Direct development dependency notice

| Package | Version | License |
|---|---:|---|
| `@playwright/test` | 1.59.1 | Apache-2.0 |
| `@types/node` | 25.6.2 | MIT |
| `@types/react` | 19.2.14 | MIT |
| `@types/react-dom` | 19.2.3 | MIT |
| `@types/web-push` | 3.6.4 | MIT |
| `@vitest/coverage-v8` | 4.1.5 | MIT |
| `typescript` | 6.0.3 | Apache-2.0 |
| `vitest` | 4.1.5 | MIT |

## Maintenance checklist

Before public release or major dependency updates:

1. Re-read `package.json` and `package-lock.json` for direct dependency versions and license fields.
2. Check whether a dependency requires extra NOTICE text, attribution, source redistribution, or policy documentation.
3. Keep generated or local audit output out of git unless it is intentionally curated.
4. Update this page in the same PR as dependency changes when the public notice changes.

## AI-assisted contribution transparency

Use [`../ai-logs/README.md`](../ai-logs/README.md) for AI contribution log guidance and templates.
