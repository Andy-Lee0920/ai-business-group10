import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InjectionCountdownArc } from '../../src/components/injection-countdown-arc';

describe('InjectionCountdownArc', () => {
  it.each([
    { remainingMinutes: 60, progress: '0.00', offsetRatio: 1 },
    { remainingMinutes: 30, progress: '0.50', offsetRatio: 0.5 },
    { remainingMinutes: 0, progress: '1.00', offsetRatio: 0 },
  ])('renders the $progress fill state', ({ remainingMinutes, progress, offsetRatio }) => {
    const markup = renderToStaticMarkup(React.createElement(InjectionCountdownArc, {
      totalMinutes: 60,
      remainingMinutes,
      size: 240,
    }));

    expect(markup).toContain('data-testid="injection-countdown-arc"');
    expect(markup).toContain(`data-progress="${progress}"`);
    expect(markup).toContain('stroke="var(--slc-border)"');
    expect(markup).toContain('stroke="var(--slc-coral)"');

    const dashArray = Number(markup.match(/stroke-dasharray="([^"]+)"/u)?.[1]);
    const dashOffset = Number(markup.match(/stroke-dashoffset="([^"]+)"/u)?.[1]);
    expect(dashOffset).toBeCloseTo(dashArray * offsetRatio, 6);
  });
});
