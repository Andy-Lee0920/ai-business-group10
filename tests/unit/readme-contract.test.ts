import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readme = () => readFileSync('README.md', 'utf8');

describe('README current product contract', () => {
  it('points to the canonical North Star and current deployment lanes', () => {
    const doc = readme();

    expect(doc).toContain('Same app. Shared state. Different experience.');
    expect(doc).toContain('docs/01-product/fevio-product-north-star.md');
    expect(doc).not.toContain('docs/01-product/FEVIO_NORTH_STAR.md');
    expect(doc).toContain('https://project-oznp0.vercel.app');
    expect(doc).toContain('https://ai-business-group10.vercel.app/demo?mode=stage&stage=2');
  });

  it('keeps the demo described as state-driven utility UI, not static mock screens', () => {
    const doc = readme();

    expect(doc).toContain('IVF_STAGE');
    expect(doc).toContain('SHARING_LEVEL');
    expect(doc).toContain('UTILITY_CARD_STATE');
    expect(doc).toContain('ACTION_LOG');
    expect(doc).toContain('static mock screen이 아닙니다');
  });

  it('keeps safety boundaries visible from the repo entry point', () => {
    const doc = readme();

    expect(doc).toContain('No medical judgment');
    expect(doc).toContain('Raw clinic text는 partner view에 노출하지 않는다');
    expect(doc).toContain('LLM은 비정형 병원 안내/사진/문자를 일정 후보로 바꾸는 보조 도구다');
    expect(doc).toContain('사용자가 확인하기 전에는 실행 일정으로 저장하지 않는다');
  });
});
