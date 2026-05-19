# ADR 0014 — Medication reference image is deterministic mapping only

## Status

Accepted — 2026-05-19

## Context

Home hero (`/home`) needs a visual anchor for medication/injection cards so the user can verify "this is the right drug" without reading more text. The hero text budget is already capped at 4 elements / 3 lines (see `#385` simplification per ADR 0013 follow-up).

Two natural temptations exist as the product grows:

1. Ask the LLM (currently OpenRouter Vision / Gemini) to also emit an image URL or describe the medication's packaging when it processes the clinic photo.
2. Use AI image generation to render a "drug-like" visual when no reference asset exists.

Both are unsafe for Fevio. The hero image becomes an implicit medical claim: if the screen shows an Ovidrel box, the user reads "this is what I should be holding". An LLM-suggested or AI-generated image that gets the brand, dose form, or color wrong is no longer a calm anchor — it becomes a wrong-drug risk surface.

The PRD invariants already prohibit medical judgment, dosage decisions, and treatment recommendations from LLM output. Drug imagery is the same class of risk.

## Options compared

| Option | Source of image | Risk | Reach |
|---|---|---|---|
| A. LLM suggests image | Vision model emits image URL or describes box and we render | Hallucinated brand/form. Surprising on rare drugs. Effectively medical claim by image. | Wide coverage, no asset curation |
| B. AI image generation | Generate stylized rendering on demand | Always wrong on packaging detail. Worst trust signal. | Wide |
| C. Deterministic mapping | `medication_id` or normalized title → static asset; missing = hide | Zero hallucination. Limited to curated drug list. | Only covers known assets |

## Decision

Adopt **Option C: deterministic mapping from confirmed medication identity to a curated static asset**. Missing assets render no image — never a fallback render, never an LLM guess, never a placeholder that implies "this is your drug".

### Rules

1. **Identity source**: the medication identity used to select an image must be one of `care_action_cards.medication_id`, `care_action_cards.title` after deterministic normalization, or an equivalent confirmed identifier. AI/OCR-extracted titles are eligible **only after** they have passed the user confirm step (per ADR 0013).
2. **Mapping shape**: deterministic lookup from normalized identity → asset path. The mapping itself lives in a Supabase-managed table (`medication_reference_assets` or equivalent) so that asset additions, replacements, and takedowns do not require a code deploy. Lookup is exact-match on the normalized key; no fuzzy match, no model inference, no remote third-party fetch at render time.
3. **Storage**: asset files live in a public-read Supabase Storage bucket (e.g. `medication-assets`). The DB row references the bucket path. Public read is acceptable because the asset is a non-sensitive stylized illustration, not a user's personal data.
4. **Visual style (initial)**: assets are **stylized illustrations** (option C of the sourcing analysis), not photographs of real product packaging. They preserve identity cues (box outline, brand text, dose form) so the user can verify "this is the right drug", but they are visibly not a manufacturer photo. This narrows the trademark and pharmaceutical-advertising risk surface for the closed beta.
5. **Takedown**: rows can be marked disabled (or deleted) at any time. The renderer must treat disabled rows as "no image" identically to missing rows.
6. **Missing asset = hide**: if the identity has no curated asset, the hero hides the image area entirely. Do not render a generic syringe/pill silhouette as if it were the user's drug.
7. **Forbidden sources**:
   - LLM output (`schedule-extract`, `photo-analyze`, any future agent) may not emit image URLs or filenames that the renderer uses.
   - AI image generation (in-app or via gateway) is prohibited for medication anchors.
   - Free-text user input may not be used as image lookup key without normalization to the curated mapping.
8. **Copy framing**: the image is a reference. Acceptable framing copy: "확인을 돕는 참고 이미지", "병원 안내와 약 이름을 함께 확인해 주세요", "실제 제품/포장과 다를 수 있어요". Forbidden framings: "이 약을 사용하세요", "이 제품이 맞습니다", "이 용량으로 주사하세요", "복부 오른쪽 아래에 주사하세요".
9. **Injection site disclosure**: a specific anatomical injection site may be displayed **only if** the user explicitly confirmed and saved it. The renderer may not derive site copy from drug class.

### Initial asset scope

Start small. The first curated set is the medications listed in `mvp-target.md` care examples:

- Ovidrel / 오비드렐
- Gonal-F / 고날에프
- Cetrotide / 세트로타이드
- Menopur / 메노푸어

Additional medications are added by appending to the mapping, not by relaxing the rules above.

## Consequences

### Easier

- One trust contract: the image either matches a confirmed identity, or it is absent.
- No prompt engineering / output validation for image emission.
- No image generation cost or moderation surface.
- The asset list is auditable in git history.

### Harder

- Coverage is finite. Users on rare protocols may see no image.
- Adding a medication requires asset curation work, not just a model update.
- The renderer must accept "no image" as a first-class state, including for `injection_countdown` hero.

### Prohibited

- Do not let the OCR/AI pipeline write image URLs into `care_action_cards` or `split_candidates`.
- Do not infer injection site from medication class.
- Do not display copy that turns the reference image into a usage instruction.
- Do not fall back to a stock "pill" or "syringe" silhouette as if it were the user's drug.

## Follow-up criteria for revisiting

Open a follow-up ADR only if:

1. Coverage gap measurably damages user trust (telemetry shows a high fraction of users on uncurated drugs and complaining), and a safe extension path (e.g., manufacturer-provided official asset feed) becomes available.
2. A regulated jurisdiction explicitly requires labeled medication imagery on care apps; in that case the requirement becomes the source, not LLM/AI generation.

## Related

- ADR 0013: confirm spine canonical — image lookup only runs on confirmed identities
- ADR 0002: P0 boost rules — no model-authored medical judgment stored as truth
- `docs/01-product/mvp-target.md` — Safety Boundary §6, LLM advisory-only
- CLAUDE.md — "Fevio is not a diagnosis tool, treatment planner, dosage advisor"
- Issue: new child of `#385` — "feat(home): medication reference image deterministic mapping"
