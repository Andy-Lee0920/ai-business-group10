import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const privacyPage = readFileSync('app/privacy/page.tsx', 'utf8');
const landingPage = readFileSync('app/page.tsx', 'utf8');
const onboardingScreen = readFileSync('src/features/onboarding/onboarding-screen.tsx', 'utf8');
const slcCopy = readFileSync('src/domain/slc-copy.ts', 'utf8');

describe('SLC auth entry contract', () => {
  it('uses one privacy gate cookie and skips repeat visitors to the safe next path', () => {
    expect(privacyPage).toContain('fevio_privacy_gate_v1');
    expect(privacyPage).toContain("cookieStore.get(PRIVACY_GATE_COOKIE)?.value === 'accepted'");
    expect(privacyPage).toContain('redirect(nextPath)');
    expect(privacyPage).toContain('확인하고 계속');
    expect(privacyPage).not.toContain('type="checkbox"');
  });

  it('keeps the login entry single-purpose with the strongest Google CTA and boundary note', () => {
    expect(landingPage).toContain('Google로 계속하기');
    expect(landingPage).toContain('Fevio는 의료 판단을 하지 않습니다');
    expect(landingPage).not.toContain('Google로 시작하기');
  });

  it('starts onboarding with Welcome, then Role, First Schedule, and Confirm after the privacy gate accepted consent', () => {
    expect(onboardingScreen).toContain("useState<OnboardingStep>('brand_intro')");
    expect(onboardingScreen).toContain('오늘 필요한 것만');
    expect(onboardingScreen).toContain('보여드릴게요');
    expect(onboardingScreen).toContain('누구로 시작할까요?');
    expect(onboardingScreen).toContain('buildAcceptedConsentChecks');
    expect(onboardingScreen).toContain('공유 코드만 확인할게요');
    expect(onboardingScreen).toContain('처음 확인할 일정을 하나만 남겨주세요');
    expect(onboardingScreen).toContain('이 일정으로 Home을 시작할게요');
    expect(onboardingScreen).toContain('SLC_SAFE_COPY.onboardingSaveFailed');
    expect(slcCopy).toContain('시작 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    expect(onboardingScreen).not.toContain('data.error ??');
    expect(onboardingScreen).not.toContain('Fevio 민감정보 동의');
  });
});
