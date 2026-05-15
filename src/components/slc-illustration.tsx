import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { SLCAsset } from '../design/slc-assets';

export type SLCIllustrationSize = 'hero' | 'card' | 'empty' | 'icon' | 'banner';

interface SLCIllustrationProps {
  asset: SLCAsset;
  size?: SLCIllustrationSize;
  priority?: boolean;
  style?: CSSProperties;
}

export function SLCIllustration({ asset, size = 'card', priority = false, style }: SLCIllustrationProps) {
  const decorative = asset.decorative === true;
  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={decorative ? '' : asset.alt}
      aria-hidden={decorative ? true : undefined}
      priority={priority}
      style={{ ...sizeStyle(size), ...style }}
    />
  );
}

function sizeStyle(size: SLCIllustrationSize): CSSProperties {
  const common: CSSProperties = {
    display: 'block',
    height: 'auto',
    objectFit: 'contain',
  };

  if (size === 'hero') return { ...common, width: 'min(72%, 240px)', margin: '0 auto' };
  if (size === 'empty') return { ...common, width: 'min(56%, 184px)', margin: '0 auto 18px', opacity: 0.92 };
  if (size === 'icon') return { ...common, width: 54, margin: 0 };
  if (size === 'banner') return { ...common, width: '100%', maxHeight: 96, objectFit: 'cover', borderRadius: 18 };
  return { ...common, width: 'min(44%, 136px)', margin: '0 auto' };
}
