import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEVIO_PRODUCT_NORTH_STAR, IVF_CARE_CYCLE_STAGES } from '../../src/product/north-star';

const northStarDoc = () => readFileSync('docs/01-product/fevio-product-north-star.md', 'utf8');

describe('Fevio Product North Star contract', () => {
  it('keeps the production one-sentence product definition in code and docs', () => {
    const doc = northStarDoc();
    expect(FEVIO_PRODUCT_NORTH_STAR.tagline).toBe('Same app. Shared state. Different experience.');
    expect(FEVIO_PRODUCT_NORTH_STAR.oneSentence).toContain('Generative UI Care OS');
    expect(FEVIO_PRODUCT_NORTH_STAR.productionLead).toContain('utility interface');
    expect(doc).toContain(FEVIO_PRODUCT_NORTH_STAR.tagline);
    expect(doc).toContain(FEVIO_PRODUCT_NORTH_STAR.oneSentence);
  });

  it('treats the 7-stage IVF cycle and stage 4 safe label as non-negotiable', () => {
    expect(IVF_CARE_CYCLE_STAGES).toEqual(['사전 검사', '배란 유도', '난자 채취', '수정 준비', '배아 배양', '배아 이식', '임신 확인']);
    expect(IVF_CARE_CYCLE_STAGES[3]).toBe('수정 준비');
    expect(IVF_CARE_CYCLE_STAGES.join(' ')).not.toMatch(/정자 추출|남편이 해야 하는 날|남성 파트너의 과제/u);
  });

  it('requires Vercel-visible utility product surfaces, not static fake screens', () => {
    expect(FEVIO_PRODUCT_NORTH_STAR.nonNegotiables).toContain('No static fake screen.');
    expect(FEVIO_PRODUCT_NORTH_STAR.nonNegotiables).toContain('No long explanatory phone copy.');
    expect(FEVIO_PRODUCT_NORTH_STAR.nonNegotiables).toContain('No partner copy-paste view.');
    expect(FEVIO_PRODUCT_NORTH_STAR.primaryQuestion).toContain('shared care state');
  });
});
