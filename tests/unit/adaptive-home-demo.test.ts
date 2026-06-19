import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  AdaptiveHomeDemo,
  buildAdaptiveHomeDemoState,
  getAdaptiveHomeDemoCare,
} from '../../src/features/today/adaptive-home-demo';

describe('adaptive home demo', () => {
  const now = new Date('2026-06-18T04:00:00.000Z');

  it.each([
    ['injection_day', '주사'],
    ['clinic_day', '방문'],
    ['waiting_day', '기다리는'],
    ['two_week_wait_day', '피검'],
    ['result_protection_day', '결과'],
  ])('renders the %s home state', (careDay, expectedText) => {
    const markup = renderToStaticMarkup(
      React.createElement(AdaptiveHomeDemo, {
        care: getAdaptiveHomeDemoCare({ care: careDay }),
        now,
      }),
    );

    expect(markup).toContain(expectedText);
    expect(buildAdaptiveHomeDemoState(getAdaptiveHomeDemoCare({ care: careDay }), now).context.careDay).toBe(careDay);
  });
});
