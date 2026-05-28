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

  it('frames the demo around hospital memo input instead of stage switching or internal UI terms', () => {
    const source = readFileSync('app/demo/intro-landing.tsx', 'utf8');
    expect(source).toContain('IVF_STAGES.map');
    expect(source).toContain('병원 안내가 두 개의 케어 화면으로 바뀝니다');
    expect(source).toContain('병원 안내 넣어보기');
    expect(source).toContain('One memo.');
    expect(source).not.toContain('Generative UI');
    expect(source).not.toContain('7단계 데모 시작하기');
    expect(source).not.toContain('onSelectStage');
    expect(source).not.toContain('framer-motion');
    expect(source).not.toContain('<svg');
  });
});
