import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEVIO_CUSTOMER_EXPERIENCE_JOBS, FEVIO_PRODUCT_NORTH_STAR, IVF_CARE_CYCLE_STAGES } from '../../src/product/north-star';

const northStarDoc = () => readFileSync('docs/01-product/fevio-product-north-star.md', 'utf8');

describe('Fevio Product North Star contract', () => {
  it('keeps the production one-sentence product definition in code and docs', () => {
    const doc = northStarDoc();
    expect(FEVIO_PRODUCT_NORTH_STAR.tagline).toBe('병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.');
    expect(FEVIO_PRODUCT_NORTH_STAR.oneSentence).toContain('치료 운영 앱');
    expect(FEVIO_PRODUCT_NORTH_STAR.productionLead).toContain('병원 안내, 투약 시간, 주사 기록, 파트너 공유');
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
    expect(FEVIO_PRODUCT_NORTH_STAR.nonNegotiables).toContain('No unconfirmed AI output as an executable care action.');
    expect(FEVIO_PRODUCT_NORTH_STAR.primaryQuestion).toContain('IVF 치료 실행 누락');
  });

  it('locks the customer experience jobs to care-operation value, not generic calendar or emotion app value', () => {
    const jobs = FEVIO_CUSTOMER_EXPERIENCE_JOBS.join('\n');

    expect(FEVIO_CUSTOMER_EXPERIENCE_JOBS).toHaveLength(10);
    expect(jobs).toContain('오늘 해야 할 주사, 약, 내원, 확인할 일');
    expect(jobs).toContain('최종 확인과 저장은 사용자가 한다');
    expect(jobs).toContain('오늘 도울 역할만 공유한다');
    expect(jobs).toContain('단순 캘린더가 아니라');
    expect(jobs).not.toContain('감정 케어를 강요한다');
  });
});
