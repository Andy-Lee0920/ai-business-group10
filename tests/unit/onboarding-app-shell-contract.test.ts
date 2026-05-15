import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const onboardingClient = readFileSync('app/onboarding/onboarding-client.tsx', 'utf8');
const onboardingPage = readFileSync('app/onboarding/page.tsx', 'utf8');
const authedLayout = readFileSync('app/(authed)/layout.tsx', 'utf8');

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

  it('renders premium brand intro, role select, first-add prompt, partner exit, and add method cards', () => {
    for (const copy of [
      'Fevio',
      '소중한 시작을,',
      '시작하기',
      '본인',
      '파트너',
      '병원 안내를',
      '그대로 옮겨주세요',
      '추가하기',
      'addMethodIntroScreen',
      'addMethodIntroAmbient',
      '파트너는 초대 링크로 들어와 주세요',
      '어떻게 추가할까요?',
      '사진으로 남기기',
      '문자로 붙여넣기',
      '직접 적기',
    ]) {
      expect(onboardingClient).toContain(copy);
    }
  });

  it('keeps direct entry confirmation-first and preview-driven', () => {
    expect(onboardingClient).toContain('이 일정 기억하기');
    expect(onboardingClient).toContain("fetch('/api/schedule/add'");
    expect(onboardingClient).toContain('홈 미리보기');
  });

  it('implements photo processing with native image pickers, upload/analyze progress, and safe fallback', () => {
    expect(onboardingClient).toContain('type="file" accept="image/*" capture="environment"');
    expect(onboardingClient).toContain('type="file" accept="image/*"');
    expect(onboardingClient).toContain("fetch('/api/onboard/photo-upload'");
    expect(onboardingClient).toContain("fetch('/api/onboard/photo-analyze'");
    for (const copy of ['사진 찍기', '사진 선택', '업로드 완료', '내용 분석 중', '일정 후보 준비', '사진에서 일정을 찾지 못했어요', '다시 찍기']) {
      expect(onboardingClient).toContain(copy);
    }
    expect(onboardingClient).not.toContain('getUserMedia');
    expect(onboardingClient).not.toContain('camera viewport');
  });

  it('implements candidate review inline edits and confirm API payload', () => {
    expect(onboardingClient).toContain("activeStep === 'candidate_review'");
    expect(onboardingClient).toContain('저장 전,');
    expect(onboardingClient).toContain('formatCandidateType(candidate.type)');
    expect(onboardingClient).toContain('input type="datetime-local"');
    expect(onboardingClient).toContain('candidateEdits');
    expect(onboardingClient).toContain('confirmedIds');
    expect(onboardingClient).toContain('rejectedIds');
    expect(onboardingClient).toContain("fetch('/api/onboard/candidates/confirm'");
    expect(onboardingClient).toContain('후보가 없어요');
  });

  it('implements text paste analysis with a bounded textarea and candidate review reuse', () => {
    expect(onboardingClient).toContain("activeStep === 'text_paste'");
    expect(onboardingClient).toContain('maxLength={1000}');
    expect(onboardingClient).toContain('{textPasteValue.length}/1000');
    expect(onboardingClient).toContain("fetch('/api/onboard/text-analyze'");
    expect(onboardingClient).toContain('분석하기');
    expect(onboardingClient).toContain('일정을 찾지 못했어요');
    expect(onboardingClient).toContain('직접 입력으로 바꾸기');
    expect(onboardingClient).toContain("goToStep('candidate_review')");
  });

  it('implements sharing and complete handoff with partner invite intent and home redirect', () => {
    for (const copy of ['나 혼자 시작할게요', '파트너와 함께 쓸게요', '일정 후보를 만들었어요', '일정 후보 요약']) {
      expect(onboardingClient).toContain(copy);
    }
    expect(onboardingClient).toContain("fetch('/api/onboarding/complete'");
    expect(onboardingClient).toContain("partnerInvite: { intent: partnerIntent }");
    expect(onboardingClient).toContain("window.location.assign(payload.redirectTo ?? '/home')");
    expect(onboardingClient).toContain("'prepare_invite'");
  });

  it('recovers completed onboarding consent before guarding /home', () => {
    expect(authedLayout).toContain("fevio_onboarding_role_context");
    expect(authedLayout).toContain('recoverConsentFromCompletedOnboarding');
    expect(authedLayout).toContain("from('user_consents')");
    expect(authedLayout).toContain("consent_source: 'onboarding'");
  });

  it('renders the new app onboarding shell from /onboarding after privacy acceptance', () => {
    expect(onboardingPage).toContain("import { OnboardingClient } from './onboarding-client'");
    expect(onboardingPage).toContain('return <OnboardingClient />');
    expect(onboardingPage).not.toContain('OnboardingScreen');
  });
});
