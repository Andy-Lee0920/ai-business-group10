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
    ['injection_day', '주사', '1/5 · 난포 자극'],
    ['clinic_day', '방문', '2/5 · 초음파·채혈'],
    ['waiting_day', '기다리는', '3/5 · 채취·배양'],
    ['two_week_wait_day', '피검', '4/5 · 이식 후 대기'],
    ['result_protection_day', '결과', '5/5 · 결과 보호'],
  ])('renders the %s home state', (careDay, expectedText, stageText) => {
    const markup = renderToStaticMarkup(
      React.createElement(AdaptiveHomeDemo, {
        care: getAdaptiveHomeDemoCare({ care: careDay }),
        now,
      }),
    );

    expect(markup).toContain(expectedText);
    expect(markup).toContain('IVF 5단계');
    expect(markup).toContain(stageText);
    expect(buildAdaptiveHomeDemoState(getAdaptiveHomeDemoCare({ care: careDay }), now).context.careDay).toBe(careDay);
  });
});
