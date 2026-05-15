import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InjectionCountdownArc } from '../../src/components/injection-countdown-arc';

describe('InjectionCountdownArc', () => {
  it.each([
    { remainingSeconds: 3600, ratio: '1.00', visibleRatio: 1 },
    { remainingSeconds: 1800, ratio: '0.50', visibleRatio: 0.5 },
  ])('renders the $ratio drain state without blur', ({ remainingSeconds, ratio, visibleRatio }) => {
    const markup = renderToStaticMarkup(React.createElement(InjectionCountdownArc, {
      totalSeconds: 3600,
      remainingSeconds,
      size: 240,
    }));

    expect(markup).toContain('data-testid="injection-countdown-arc"');
    expect(markup).toContain(`data-progress="${ratio}"`);
    expect(markup).toContain('stroke="rgba(201,95,75,0.14)"');
    expect(markup).toContain('stroke="var(--slc-coral)"');
    expect(markup).not.toContain('drop-shadow');

    const [visibleLength, circumference] = markup
      .match(/stroke-dasharray="([^"]+)"/u)?.[1]
      .split(' ')
      .map(Number) ?? [];
    expect(visibleLength).toBeCloseTo(circumference * visibleRatio, 6);
    expect(markup).toContain('stroke-dashoffset="0"');
  });

  it('renders an empty arc at zero seconds', () => {
    const markup = renderToStaticMarkup(React.createElement(InjectionCountdownArc, {
      totalSeconds: 3600,
      remainingSeconds: 0,
      size: 240,
    }));

    expect(markup).toContain('data-testid="injection-countdown-arc"');
    expect(markup).not.toContain('data-testid="injection-countdown-arc-fill"');
    expect(markup).not.toContain('stroke="var(--slc-coral)"');
    expect(markup).not.toContain('rgba(201,95,75,0.14)');
    expect(markup).not.toContain('drop-shadow');
  });
});
