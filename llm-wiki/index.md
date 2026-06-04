# Fevio LLM Wiki

This sample wiki is a compact memory layer for agents working on Fevio. It is not a status tracker. Use it to keep product intent, safety rules, and non-obvious engineering constraints close to the surface before changing code.

## Read First

1. [Product North Star](wiki/01-product-north-star.md)
2. [Safety Principles](wiki/03-safety-principles.md)
3. [Hidden Insights](wiki/08-hidden-insights.md)

## Stable Product Loop

```text
Authenticate
-> accept privacy and clinical boundaries
-> create couple shell
-> capture clinic memo
-> split into candidate actions
-> user confirms meaning and ownership
-> persist confirmed care cards
-> compute today's care context
-> render dynamic home
-> optionally share sanitized partner view
```

## Agent Use

- Start from confirmed care actions, not inferred medical truth.
- Treat privacy acceptance as a write boundary.
- Keep partner surfaces sanitized and server-filtered.
- Prefer deterministic domain logic before AI assistance.
- Verify product behavior with URL-action-result evidence when UI changes.

