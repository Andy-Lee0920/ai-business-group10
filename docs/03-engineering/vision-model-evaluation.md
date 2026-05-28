# Vision Model Evaluation Gate — #376

## Decision boundary

OpenRouter remains the provider for MVP image-to-card extraction. #376 is not a provider migration and not an instruction to change production env immediately.

Current implementation:

- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Runtime model selector: `OPENROUTER_VISION_MODEL`
- Current default fallback: `anthropic/claude-haiku-4.5`
- Candidate under review: `google/gemini-3-flash-preview`

Do not change env from preference alone. Change `OPENROUTER_VISION_MODEL` only after a same image sample comparison shows a better extraction result for the MVP care-card fields.

## Comparison protocol

Use 2–3 production-safe clinic instruction images. For each same image sample, run the current model and `google/gemini-3-flash-preview` through the same `/onboard/prescription-capture` / schedule-extract path.

Score only observable card fields:

| Field | Pass condition |
| --- | --- |
| time | Extracted schedule time matches the document or is left for manual confirmation when ambiguous. |
| medication name | Korean/English medication or injection name is preserved without hallucinated dosage advice. |
| card type | Candidate is correctly classified as `injection`, `medication`, or `clinic`; user still confirms before save. |
| injection site | Site/preparation text is copied only when present in the source; no medical inference. |

## Safety constraints

- manual path remains available even when OpenRouter fails or returns weak candidates.
- LLM output is advisory only; user confirmation decides owner/card type before persistence.
- Do not log image URLs, raw tokens, OpenRouter keys, or private clinic text in issue comments.
- If `google/gemini-3-flash-preview` is not clearly better, keep the current env and comment the comparison result plus next candidate.

## Env change checklist when Gemini wins

1. Set Vercel production `OPENROUTER_VISION_MODEL=google/gemini-3-flash-preview`.
2. Set Supabase Edge Function `OPENROUTER_VISION_MODEL=google/gemini-3-flash-preview`.
3. Smoke `/onboard/prescription-capture`: upload a safe sample image, inspect card candidates, confirm manual edit path still works.
4. Comment #376 with red/green evidence and the URL-action-result smoke result.
