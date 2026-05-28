# Fevio brand asset source

Status: production asset source for the Phase 0.5 → P1 design-system closure lane.

## Source of truth

- Logo SVG: `public/logo.svg`
- App icons: `public/icon-512.png`, `public/apple-touch-icon.png`, `public/favicon.svg`, `public/favicon.ico`
- OG image: `public/og-image.png`
- P1 product icon set: `public/assets/fevio/*.svg`
- Asset registry: `src/design/assets.ts`

## Rendering rules

- Korean-capable font stack comes first in SVG text: `Noto Sans KR`, `Apple SD Gothic Neo`, then system fallbacks.
- OG image must not depend on missing Korean glyph rendering. If Korean text cannot be embedded reliably, use Latin-safe brand text plus token colors.
- Icons use the Fevio semantic palette only: cream, sage, lavender, coral, sky, border/secondary text.
- Baby, trophy, and fear-based syringe imagery are excluded from core assets.

## Regeneration note

The current OG image is intentionally simple and Latin-safe until a font-embedded rendering pipeline is added. Do not paste screenshots or slide PNGs as production brand assets.
