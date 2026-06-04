# 03 Safety Principles

Fevio handles sensitive fertility-care context, so safety is a product boundary, not a copy layer.

## Confirmation First

Only user-confirmed care cards can become executable home instructions.

Draft candidates, OCR output, AI suggestions, uncertain classifications, and local UI taps must not become persisted care instructions until the user confirms meaning and ownership.

## Privacy Before Data

Sensitive care data must not be written before privacy and clinical boundary acceptance.

The gate is a write boundary:

- No raw clinic memo before consent.
- No private care table writes before consent.
- No partner projection before server-controlled token validation.

## Medical Boundary

Fevio must not provide:

- diagnosis
- treatment recommendation
- dosage adjustment
- medication timing decision
- embryo quality judgment
- success prediction
- symptom risk assessment

`display_safety_level` is deterministic UI priority. It is not stored medical judgment.

## Partner Safety

Partner access is link-based and accountless for v1.0.

Partner View must be a sanitized, server-filtered projection. It must not expose:

- raw visit notes
- raw partner tokens
- private primary-user context
- direct database access
- broad medical detail

## AI Boundary

Manual workflow must work without AI.

AI may suggest split candidates later, but it must fail closed into manual review. It must not assign ownership, decide safety priority, infer dosage, or generate confirmed care cards directly.

## Verification

Use tests and smoke evidence that match the risk:

- Pure domain logic: unit tests.
- Data and RLS boundaries: integration or RLS tests.
- Product UI: browser or URL-action-result evidence.
- Deployment-sensitive behavior: preview or production smoke evidence, or an explicit deployment gap.

