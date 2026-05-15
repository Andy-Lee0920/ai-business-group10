import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const screen = readFileSync('src/features/onboarding/onboarding-screen.tsx', 'utf8');
const flow = readFileSync('src/features/onboarding/onboarding-flow.ts', 'utf8');

describe('Session A onboarding redesign contract', () => {
  it('starts with brand welcome, then role cards, four consent checks, first schedule interview, and confirmation', () => {
    for (const copy of [
      '오늘의 주사와 약을 조용히 챙겨드릴게요',
      '병원 안내를 사용자가 확인한 일정으로 바꿔서 첫 화면에 보여드립니다.',
      '🌿♡',
      'stepDots',
      'role-split-cards',
      '기록자',
      '파트너',
      '개인정보 수집·이용에 동의합니다.',
      '민감정보 처리에 동의합니다.',
      'Fevio는 의료 판단을 하지 않음을 이해했습니다.',
      'AI/입력 보조는 자동 저장하지 않음을 이해했습니다.',
      '초대 코드 입력',
      '첫 일정 입력하기',
      '약품 검색',
      '방문 일정은 약품 검색 없이 날짜와 시간만 먼저 확인합니다.',
      '방문 일정 이름',
      '직접 입력하기',
      '선택적 메모',
      '나중에 할게요',
      '확인하고 저장',
      '확인 후 저장 · 입력 보조 자동 저장 없음',
    ]) {
      expect(screen + flow).toContain(copy);
    }
    expect(screen).toContain('onboardingTokens.primary');
    expect(screen).toContain("fetch('/api/clinic-guide/normalize'");
    expect(screen).toContain("fetch('/api/onboarding'");
    expect(screen).not.toContain('var(--slc');
  });
});
