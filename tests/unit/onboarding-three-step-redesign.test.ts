import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const screen = readFileSync('src/features/onboarding/onboarding-screen.tsx', 'utf8');

describe('onboarding 3-step redesign contract', () => {
  it('starts with brand welcome, then role cards, then two explicit consent checks and invite code for partners', () => {
    for (const copy of [
      '오늘의 주사와 약을 조용히 챙겨드릴게요',
      '여러분의 하루가 더 가볍고 안정될 수 있도록 함께합니다.',
      'stepDots',
      '나는 치료를 받고 있어요',
      '나는 파트너예요',
      '개인정보 수집 동의',
      '민감정보 처리 동의',
      '초대 코드 입력',
      '동의하고 시작하기',
      '동의하고 연결하기',
    ]) {
      expect(screen).toContain(copy);
    }
    expect(screen).not.toContain('파트너를 연결하면 오늘 일정과 완료 상태가 read-only로 공유될 수 있음을 이해했습니다.');
  });
});
