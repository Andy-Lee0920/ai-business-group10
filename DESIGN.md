# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-05-16
- Primary product surfaces: onboarding, privacy gate, home/today, calendar, records, clinic update, settings, partner projection.
- Evidence reviewed: `AGENTS.md`, `docs/02-design/designer-brief.md`, `docs/02-design/deck.md`, `docs/02-design/phase-distinct-layout-composition.md`, `app/globals.css`, `app/(authed)/layout.tsx`, `src/components/bottom-nav.tsx`, `src/features/today/today-screen.tsx`, `src/features/onboarding/onboarding-screen.tsx`.

## Brand
- Personality: calm, precise, warm, Korean-first, low-pressure.
- Trust signals: privacy-before-data, user confirmation before saving care actions, restrained medical boundaries.
- Avoid: generic SaaS dashboards, dense settings-like onboarding, alarmist urgency, raw implementation labels.

## Product goals
- Goals: turn clinic instructions into confirmed care actions; make today’s next action obvious; support partner awareness without exposing raw clinical text.
- Non-goals: diagnosis, treatment planning, dose advice, medical-device behavior.
- Success signals: user can understand today’s action in the first viewport; repeated schedules summarize cleanly; settings/reset paths do not feel like technical auth flows.

## Personas and jobs
- Primary personas: IVF patient managing injections/medications; partner reading a sanitized support projection.
- User jobs: confirm what to do today, record completion, update after clinic, reset demo/personal data safely.
- Key contexts of use: iPhone Safari, one-handed use, emotionally loaded care moments, clinic-message copy/paste or photo OCR.

## Information architecture
- Primary navigation: five-part bottom nav — Home, Calendar, Add, Records, Settings.
- Core routes/screens: `/privacy`, `/onboarding`, `/home`, `/calendar`, `/add`, `/records`, `/clinic-update`, `/settings`, `/partner/[token]`.
- Content hierarchy: one hero/primary action first, then compact supporting rows; avoid card grids as the first impression.

## Design principles
- Principle 1: one screen, one next action; secondary information should recede.
- Principle 2: input may be messy, confirmation must be clear; missing fields are asked only where needed.
- Tradeoffs: prefer deterministic summaries over rich detail if space is constrained; use warmth through spacing and surfaces, not extra copy.

## Visual language
- Color: warm neutral background, onboarding CTA orange (`#F47D63 → #D95F4C`) for primary actions/attention, success green for completed states.
- Typography: Korean-first, high-weight short headings, muted explanatory copy.
- Spacing/layout rhythm: iPhone Safari frame uses shared `--fevio-page-*` and `--fevio-bottom-nav-*` tokens; no per-screen bottom padding guesses.
- Shape/radius/elevation: soft rounded cards, low-density shadows, no hard enterprise field grids unless actively editing.
- Motion: minimal, functional only.
- Imagery/iconography: use `SLCIllustration`/registered PNG assets; no raw `<img>` in product UI.

## Components
- Existing components to reuse: `BottomNav`, `AmbientStoryBackground`, `SLCIllustration`, `ActionCard`, `ConfirmSheet`, `SettingsRow`.
- New/changed components: mobile frame tokens and authed shell classes in `app/globals.css`.
- Variants and states: missed, due, upcoming, completed, draft, pending-confirmation.
- Token/component ownership: `app/globals.css` owns frame/safe-area tokens; feature screens consume variables instead of hardcoded iPhone padding.

## Accessibility
- Target standard: practical WCAG AA for text contrast and touch targets.
- Keyboard/focus behavior: buttons/links keep semantic roles; bottom sheet uses `role="dialog"`.
- Contrast/readability: coral text used sparingly; long Korean text should be 13–16px with sufficient line height.
- Screen-reader semantics: nav has explicit label; icon-only controls need aria labels.
- Reduced motion and sensory considerations: no required animation for comprehension.

## Responsive behavior
- Supported breakpoints/devices: iPhone Safari mobile first; desktop preview constrained to iPhone 17 Pro Max width (`--fevio-phone-frame-max`).
- Layout adaptations: pages use shared gutters/top/bottom safe-area tokens; authenticated screens keep the same desktop phone chrome as onboarding; fixed overlays align to the same max frame.
- Touch/hover differences: 48px minimum target preferred; hover is not required.

## Interaction states
- Loading: quiet skeleton or simple text; no technical errors.
- Empty: explain what appears next, not system state.
- Error: user-actionable Korean copy.
- Success: short confirmation and route to the next meaningful screen.
- Disabled: visible but calm, with opacity and preserved layout.
- Offline/slow network: fail closed; do not persist unconfirmed care data.

## Content voice
- Tone: polite, practical, emotionally restrained.
- Terminology: use 본인/파트너, 일정 후보, 저장 전 확인; avoid internal labels.
- Microcopy rules: fewer words than a spec; never imply medical judgment.

## Implementation constraints
- Framework/styling system: Next.js App Router, React inline styles plus CSS modules/global tokens.
- Design-token constraints: use `--slc-coral-gradient` for primary CTA surfaces; use `--slc-coral` for compact active states/text/borders; use `--fevio-page-gutter`, `--fevio-page-top`, `--fevio-bottom-nav-height`, `--fevio-page-bottom`, and `--fevio-mobile-frame-max` for mobile frame alignment.
- Performance constraints: no new visual dependency for shell layout.
- Compatibility constraints: Safari dynamic viewport (`100dvh`) and `env(safe-area-inset-*)` are required.
- Test/screenshot expectations: unit contract for shared frame tokens and desktop phone chrome continuity; Playwright smoke verifies no horizontal overflow on 390px and desktop iPhone frame width.

## Open questions
- [ ] Whether iPhone 17 non-Pro and Pro Max should have separate visual baselines / owner: product / impact: screenshot QA precision.
