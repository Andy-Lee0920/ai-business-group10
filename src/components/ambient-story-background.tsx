import type { CSSProperties, ReactNode } from 'react';
import { SLCIllustration } from './slc-illustration';
import type { SLCAsset } from '../design/slc-assets';

type AmbientIntensity = 'hero' | 'section' | 'subtle';
type AmbientElement = 'div' | 'main' | 'section';

interface AmbientStoryBackgroundProps {
  readonly asset: SLCAsset;
  readonly children: ReactNode;
  readonly intensity?: AmbientIntensity;
  readonly as?: AmbientElement;
  readonly priority?: boolean;
  readonly ariaLabel?: string;
  readonly style?: CSSProperties;
  readonly contentStyle?: CSSProperties;
}

const INTENSITY_STYLE = {
  hero: {
    minHeight: 340,
    imageOpacity: 0.38,
    imageInset: 'auto 0 0 auto',
    imageWidth: 'min(60%, 260px)',
    imageHeight: 'auto',
    imageObjectFit: 'contain',
    gradient: 'linear-gradient(to right, rgba(250,247,242,0.99) 0%, rgba(250,247,242,0.88) 40%, rgba(250,247,242,0.52) 62%, rgba(250,247,242,0.08) 100%)',
  },
  section: {
    minHeight: undefined,
    imageOpacity: 0.18,
    imageInset: '8px -18px auto auto',
    imageWidth: 'min(64%, 260px)',
    imageHeight: 'auto',
    imageObjectFit: 'contain',
    gradient: 'linear-gradient(135deg, rgba(250,247,244,0.32) 0%, var(--slc-bg) 92%)',
  },
  subtle: {
    minHeight: undefined,
    imageOpacity: 0.11,
    imageInset: '24px -42px auto auto',
    imageWidth: 'min(78%, 320px)',
    imageHeight: 'auto',
    imageObjectFit: 'contain',
    gradient: 'linear-gradient(180deg, rgba(250,247,244,0.18) 0%, var(--slc-bg) 82%)',
  },
} as const satisfies Record<AmbientIntensity, {
  minHeight: number | undefined;
  imageOpacity: number;
  imageInset: CSSProperties['inset'];
  imageWidth: CSSProperties['width'];
  imageHeight: CSSProperties['height'];
  imageObjectFit: CSSProperties['objectFit'];
  gradient: string;
}>;

export function AmbientStoryBackground({
  asset,
  children,
  intensity = 'subtle',
  as = 'div',
  priority = false,
  ariaLabel,
  style,
  contentStyle,
}: AmbientStoryBackgroundProps) {
  const Element = as;
  const model = INTENSITY_STYLE[intensity];

  return (
    <Element
      aria-label={ariaLabel}
      data-testid="ambient-story-background"
      data-ambient-intensity={intensity}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: model.minHeight,
        background: 'var(--slc-bg)',
        ...style,
      }}
    >
      <SLCIllustration
        asset={asset}
        size="banner"
        priority={priority}
        decorative
        style={{
          position: 'absolute',
          inset: model.imageInset,
          width: model.imageWidth,
          height: model.imageHeight,
          maxHeight: 'none',
          borderRadius: 0,
          objectFit: model.imageObjectFit,
          opacity: model.imageOpacity,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: model.gradient,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, ...contentStyle }}>{children}</div>
    </Element>
  );
}
