import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AmbientStoryBackground } from '../../src/components/ambient-story-background';
import { slcAssets } from '../../src/design/slc-assets';

describe('AmbientStoryBackground', () => {
  it('renders decorative PNG ambience behind readable content', () => {
    const markup = renderToStaticMarkup(
      <AmbientStoryBackground asset={slcAssets.home.waiting} intensity="subtle">
        <button type="button">확인</button>
      </AmbientStoryBackground>,
    );

    expect(markup).toContain('data-testid="ambient-story-background"');
    expect(markup).toContain('data-ambient-intensity="subtle"');
    expect(markup).toContain('opacity:0.11');
    expect(markup).toContain('pointer-events:none');
    expect(markup).toContain('확인');
  });

  it('keeps the home hero fade contract with 40% transparent image wash', () => {
    const markup = renderToStaticMarkup(
      <AmbientStoryBackground asset={slcAssets.home.injectionWide} intensity="hero" as="section" priority>
        <p>남은 시간</p>
      </AmbientStoryBackground>,
    );

    expect(markup).toContain('data-ambient-intensity="hero"');
    expect(markup).toContain('min-height:340px');
    expect(markup).toContain('opacity:0.7');
    expect(markup).toContain('object-fit:cover');
    expect(markup).toContain('rgba(47,41,38,0.18) 0%');
    expect(markup).toContain('transparent 35%');
    expect(markup).toContain('남은 시간');
  });
});
