import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getOrbitPosition } from '../../app/demo/intro-landing';

describe('IntroLanding orbit', () => {
  it('places stage nodes with polar coordinates from the top of the ring', () => {
    const top = getOrbitPosition({ index: 1, total: 7, radius: 225, center: 280 });
    expect(top.left).toBeCloseTo(280, 0);
    expect(top.top).toBeCloseTo(55, 0);

    const second = getOrbitPosition({ index: 2, total: 7, radius: 225, center: 280 });
    expect(second.left).toBeGreaterThan(top.left);
    expect(second.top).toBeGreaterThan(top.top);
  });

  it('reuses IVF_STAGES and exposes intro CTA/clickable stage nodes', () => {
    const source = readFileSync('app/demo/intro-landing.tsx', 'utf8');
    expect(source).toContain('IVF_STAGES.map');
    expect(source).toContain('Fevio의 핵심 아키텍처는 Generative UI다');
    expect(source).toContain('7단계 데모 시작하기');
    expect(source).toContain('Same app.');
    expect(source).not.toContain('framer-motion');
    expect(source).not.toContain('<svg');
  });
});
