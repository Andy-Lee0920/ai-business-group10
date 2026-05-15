import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const screen = readFileSync('src/features/onboarding/onboarding-screen.tsx', 'utf8');
const flow = readFileSync('src/features/onboarding/onboarding-flow.ts', 'utf8');
const ui = readFileSync('src/features/onboarding/onboarding-ui.tsx', 'utf8');

describe('Session A onboarding redesign contract', () => {
  it('starts with brand welcome, then role cards, first schedule interview, and confirmation after the privacy gate', () => {
    for (const copy of [
      'SLCIllustration',
      'slcAssets.onboarding.coupleHero',
      'slcAssets.onboarding.scheduleHero',
      'slcAssets.onboarding.patientRole',
      'slcAssets.onboarding.partnerRole',
      'slcAssets.empty.medication',
      '오늘 필요한 것만',
      '보여드릴게요',
      '병원 안내를 확인한 일정으로 바꿔 조용히 챙겨둘게요.',
      'stepDots',
      'role-split-cards',
      '치료자',
      '오늘 일정 · 완료 기록',
      '파트너',
      '공유 일정 · 읽기 전용',
      'buildAcceptedConsentChecks',
      '개인정보 수집·이용에 동의합니다.',
      '민감정보 처리에 동의합니다.',
      'Fevio는 의료 판단을 하지 않음을 이해했습니다.',
      'AI/입력 보조는 자동 저장하지 않음을 이해했습니다.',
      '공유 코드만 확인할게요',
      '저장 범위 확인됨',
      '초대 코드 입력',
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
    expect(screen).not.toContain('<img');
    expect(screen).not.toContain('FEVIO_LOGO_SRC');
    expect(screen).not.toContain('ROLE_PATIENT_IMAGE_SRC');
    expect(screen).not.toContain('ROLE_PARTNER_IMAGE_SRC');
    expect(ui).not.toContain('<img');
    expect(screen).not.toContain('var(--slc');
    for (const removedCopy of ['Fevio 민감정보 동의', '아래 4가지를 직접 확인해야 병원 안내와 일정이 저장됩니다.', '동의 후 일정 저장', 'Home에서 오늘 일정 확인', '🌿♡', '병원 안내를 사용자가 확인한 일정으로 바꿔서 첫 화면에 보여드립니다.']) {
      expect(screen).not.toContain(removedCopy);
    }
  });
});
