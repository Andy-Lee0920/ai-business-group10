import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readme = () => readFileSync('README.md', 'utf8');

describe('README first-time developer contract', () => {
  it('keeps stable product identity and source-of-truth entrypoints visible', () => {
    const doc = readme();

    expect(doc).toContain('병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.');
    expect(doc).toContain('Primary user / IVF 환자');
    expect(doc).toContain('sanitized projection');
    expect(doc).toContain('docs/SPEC_INDEX.md');
    expect(doc).toContain('docs/01-product/fevio-product-north-star.md');
    expect(doc).toContain('docs/ai-logs/README.md');
    expect(doc).toContain('docs/specs/open-source-licenses.md');
    expect(doc).not.toContain('docs/01-product/FEVIO_NORTH_STAR.md');
  });

  it('does not regress into a live dashboard or demo architecture document', () => {
    const doc = readme();

    expect(doc).toContain('Current work, stale status, and Red → Green evidence belong in GitHub, not README.');
    expect(doc).not.toContain('## 현재 배포 상태');
    expect(doc).not.toContain('IVF 7-stage demo architecture');
    expect(doc).not.toContain('IVF_STAGE');
    expect(doc).not.toContain('## Current work status');
    expect(doc).not.toContain('| Lane | URL | 목적 | 상태 |');
    expect(doc).not.toContain('https://project-oznp0.vercel.app');
    expect(doc).not.toContain('https://ai-business-group10.vercel.app/demo?mode=stage&stage=2');
  });

  it('keeps safety boundaries visible from the repo entry point', () => {
    const doc = readme();

    expect(doc).toContain('No medical judgment');
    expect(doc).toContain('Raw clinic text는 partner view에 노출하지 않는다');
    expect(doc).toContain('AI/OCR 결과는 확정 전 후보일 뿐');
    expect(doc).toContain('사용자가 확인하기 전에는 실행 일정이 되지 않습니다');
    expect(doc).toContain('do not remove fallback paths without a dedicated proof slice');
  });
});
