import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const prd = readFileSync('docs/01-product/prd-v1.0.md', 'utf8');

describe('Clinic Guide AI PRD boundary', () => {
  it('documents allowed AI assistance, forbidden medical decisions, confirmation, and secret placement', () => {
    expect(prd).toContain('Clinic Guide AI');

    for (const allowed of [
      '약품명 문자열 → medications 테이블 행 정규화',
      '다음 인터뷰 질문 제안',
      '사용자 입력 보조',
    ]) {
      expect(prd).toContain(allowed);
    }

    for (const forbidden of [
      '약 용량 추론 또는 확정',
      '투약 시간 자동 결정',
      '치료 단계 판단',
      '의학적 조언',
      '일정 자동 저장',
    ]) {
      expect(prd).toContain(forbidden);
    }

    expect(prd).toContain('requiresUserConfirmation: true');
    expect(prd).toContain('사용자 명시적 확인 후에만 저장');
    expect(prd).toContain('OpenRouter API 키');
    expect(prd).toContain('클라이언트 번들에 절대 포함되지 않는다');
    expect(prd).toContain('Supabase Edge Function 환경변수');
  });
});
