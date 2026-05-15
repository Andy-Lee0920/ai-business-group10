import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InjectionCountdownArc } from '../../src/components/injection-countdown-arc';

describe('InjectionCountdownArc', () => {
  it.each([
    { remainingSeconds: 3600, ratio: '1.00', offsetRatio: 0 },
    { remainingSeconds: 1800, ratio: '0.50', offsetRatio: 0.5 },
    { remainingSeconds: 0, ratio: '0.00', offsetRatio: 1 },
  ])('renders the $ratio drain state', ({ remainingSeconds, ratio, offsetRatio }) => {
    const markup = renderToStaticMarkup(React.createElement(InjectionCountdownArc, {
      totalSeconds: 3600,
      remainingSeconds,
      size: 240,
    }));

    expect(markup).toContain('data-testid="injection-countdown-arc"');
    expect(markup).toContain(`data-progress="${ratio}"`);
    expect(markup).toContain('stroke="var(--slc-border)"');
    expect(markup).toContain('stroke="var(--slc-coral)"');
    expect(markup).toContain('filter:drop-shadow(0 0 12px var(--slc-coral))');

    const dashArray = Number(markup.match(/stroke-dasharray="([^"]+)"/u)?.[1]);
    const dashOffset = Number(markup.match(/stroke-dashoffset="([^"]+)"/u)?.[1]);
    expect(dashOffset).toBeCloseTo(dashArray * offsetRatio, 6);
  });
});
