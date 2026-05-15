import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const onboardingClient = readFileSync('app/onboarding/onboarding-client.tsx', 'utf8');
const onboardingPage = readFileSync('app/onboarding/page.tsx', 'utf8');

describe('app onboarding shell contract', () => {
  it('declares the issue 315 onboarding step union exactly', () => {
    expect(onboardingClient).toContain("export type OnboardingStep = 'brand_intro' | 'role_select' | 'add_method' | 'photo_processing' | 'text_paste' | 'candidate_review' | 'direct_entry' | 'sharing' | 'complete';");
    expect(onboardingClient).not.toContain("'experience' | 'care_item' | 'sharing' | 'review'");
    expect(onboardingClient).not.toContain('role_selection');
  });

  it('keeps type-safe enter and exit navigation helpers for onboarding steps', () => {
    expect(onboardingClient).toContain('export function enterOnboardingStep(step: OnboardingStep): OnboardingStep');
    expect(onboardingClient).toContain('export function exitOnboardingStep(currentStep: OnboardingStep, direction: NavigationDirection): OnboardingStep');
    expect(onboardingClient).toContain('as const satisfies readonly OnboardingStep[]');
  });

  it('renders brand intro, role select with patient experience sub-step, partner exit, and add method cards', () => {
    for (const copy of [
      'Fevio',
      '오늘 필요한 것만 보여드릴게요',
      '시작하기',
      '치료자',
      '파트너',
      '처음',
      '해본 적 있음',
      '다시 준비 중',
      '파트너는 초대 링크로 들어와 주세요',
      '어떻게 추가할까요?',
      '사진으로 남기기',
      '문자로 붙여넣기',
      '직접 적기',
    ]) {
      expect(onboardingClient).toContain(copy);
    }
  });

  it('keeps direct entry confirmation-first and avoids photo/text sensitive inputs in unfinished steps', () => {
    expect(onboardingClient).toContain('이 일정 기억하기');
    expect(onboardingClient).toContain("fetch('/api/schedule/add'");
    expect(onboardingClient).toContain('홈 미리보기');
    expect(onboardingClient).not.toContain("fetch('/api/onboarding/complete'");
    expect(onboardingClient).not.toContain('type="file"');
    expect(onboardingClient).not.toContain('<textarea');
  });

  it('renders the new app onboarding shell from /onboarding after privacy acceptance', () => {
    expect(onboardingPage).toContain("import { OnboardingClient } from './onboarding-client'");
    expect(onboardingPage).toContain('return <OnboardingClient />');
    expect(onboardingPage).not.toContain('OnboardingScreen');
  });
});
