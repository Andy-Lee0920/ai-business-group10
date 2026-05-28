# Fevio Asset Kit — Phase 0.5

Status: implementation reference for issue `#123`.

## Asset locations

| Asset type | Current source | Production target |
| --- | --- | --- |
| Research and UX references | `/Users/reliqbit_mac/Downloads/FEVIO_UX` | `docs/design/fevio-design-philosophy.md` |
| Product design deck | `docs/02-design/deck.md`, `docs/02-design/designer-brief.md` | Keep as reference, not direct production assets |
| Code token map | `src/design/tokens.ts` | Imported by tests/components |
| Production asset registry | `src/design/assets.ts` | Typed manifest for logo and P1 product icons |
| P1 product icons | `public/assets/fevio/*.svg` | Reusable action, handoff, clinic note, empathy, and IVF cycle icons |
| Brand source notes | `docs/design/brand-assets-source.md` | Reproducible source and Korean glyph constraints |
| CSS variables | `app/globals.css` | Shared by app, onboarding, and demo |
| iPhone demo shell | `app/demo/dual-panel-demo.module.css` | Must use device tokens |
| App primitives | `app/fevio-ui.css`, `src/components/ui` | Must use semantic tokens |

## Color system

| Token | Value | Role |
| --- | --- | --- |
| `--fevio-cream` | `#F6F4F1` | warm app background |
| `--fevio-sage` | `#6F8F6E` | patient/action accent |
| `--fevio-lavender` | `#B9AED6` | partner/support accent |
| `--fevio-coral` | `#E07A68` | reminder/attention accent |
| `--fevio-sky` | `#F0F9FF` | calm information surface |
| `--fevio-soft-gray` | `#F3F4F6` | neutral control surface |
| `--fevio-border` | `#E5E7EB` | low-noise card borders |
| `--fevio-text-secondary` | `#6B7280` | descriptive text |
| `--fevio-text-tertiary` | `#9CA3AF` | section labels and microcopy |

Rule: new UI should not introduce raw hex colors when an existing semantic token matches the role.

## Material and shadow system

| Token | Value | Role |
| --- | --- | --- |
| `--fevio-material-ultra-thin-blur` | `20px` | nav/tab glass |
| `--fevio-material-thin-blur` | `30px` | floating panels |
| `--fevio-material-regular-blur` | `40px` | modal/card background glass |
| `--fevio-material-thick-blur` | `50px` | heavy popover |
| `--fevio-material-ultra-thick-blur` | `60px` | near-opaque sheet |
| `--fevio-glass-edge` | `rgba(255, 255, 255, 0.42)` | inner glass edge |
| `--fevio-shadow-soft` | `0 2px 8px rgba(0, 0, 0, 0.05)` | demo/internal cards |
| `--fevio-shadow-card` | `0 20px 60px rgba(50, 61, 46, 0.12)` | primary app cards |

Rule: critical IVF action cards should use solid white surfaces; glass is for framing, hierarchy, or background atmosphere.

## Device tokens

| Token | Value |
| --- | --- |
| `--fevio-phone-frame-max` | `440px` |
| `--fevio-phone-frame-height` | `956px` |
| `--fevio-phone-radius` | `53px` |
| `--fevio-phone-bezel-width` | `5px` |
| `--fevio-phone-safe-top` | `59px` |
| `--fevio-phone-safe-bottom` | `34px` |
| `--fevio-dynamic-island-top-offset` | `11px` |
| `--fevio-dynamic-island-width` | `125.67px` |
| `--fevio-dynamic-island-height` | `36.67px` |
| `--fevio-dynamic-island-radius` | `18.33px` |

Rules:

- Desktop shell: one iPhone 17 Pro Max frame, inner scroll only.
- Dual demo: two thinner iPhone frames; bezel should not overpower content.
- Real mobile: no decorative bezel.
- Dynamic Island is true black and anchored to the screen top offset.

## Typography

- Korean body text uses Noto Sans KR with Apple/system fallbacks.
- Body minimum is `16px` to avoid iOS input zoom.
- Section labels: `11px`, bold, uppercase where useful, `0.5px` letter spacing.
- Main onboarding question: `24px`, bold, `130%` line height.
- Descriptive text: `12–14px`, secondary/tertiary token colors.

## Icon and illustration direction

The committed P1 utility icon set lives in `public/assets/fevio/` and is exposed through `src/design/assets.ts`.

Rules:

- prefer simple line or filled utility icons over medical clip art;
- avoid syringes as fear imagery unless the context is an explicit medication card;
- avoid baby/celebration imagery in core flows;
- use partner/action symbols such as check, timer, handoff, note, and home support.

## Component asset inventory

| Component family | Required asset behavior |
| --- | --- |
| Interview onboarding | one question per slide, low-noise option cards, progress without pressure |
| Action-first card | time, medication/task, confirmation, partner support cue |
| Context translation card | clinical value + plain-language meaning + uncertainty boundary |
| Quiet empathy card | private-by-default emotion, optional partner-safe nudge |
| Dual-view demo | patient card changes should visibly become partner role cards |
| Release evidence | Vercel screenshot/metric must show the tokenized iPhone shell and card system |

Current committed icon families:

- `actionTimer`: time-sensitive injection/medication actions;
- `careHandoff`: patient-to-partner role translation;
- `clinicNote`: hospital instruction/protocol draft input;
- `quietEmpathy`: private emotion input with optional sharing;
- `ivfCycle`: private IVF cycle/event history.


## Reference screenshots to capture when closing #123

- `/onboarding` desktop: iPhone frame with interview slide.
- `/onboarding` real/mobile viewport: bezel-less app surface.
- `/demo` desktop: two realistic iPhones with live role translation.
- Dynamic Island metric: top offset from screen is approximately `11px`.
