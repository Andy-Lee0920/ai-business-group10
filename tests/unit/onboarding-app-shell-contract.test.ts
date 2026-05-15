import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const onboardingClient = readFileSync('app/onboarding/onboarding-client.tsx', 'utf8');
const onboardingPage = readFileSync('app/onboarding/page.tsx', 'utf8');
const authedLayout = readFileSync('app/(authed)/layout.tsx', 'utf8');
const onboardingStyles = readFileSync('app/onboarding/onboarding.module.css', 'utf8');

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

  it('renders premium brand intro, role select, partner exit, and merged add method cards', () => {
    for (const copy of [
      'Fevio',
      '소중한 시작을,',
      '시작하기',
      '본인',
      '파트너',
      '파트너는 초대 링크로 들어와 주세요',
      '어떻게 추가할까요?',
      '확인 후에만 저장해요.',
      '사진으로 남기기',
      '처방지나 안내문을 찍어주세요',
      '문자로',
      '붙여넣기',
      '직접 적기',
      '이름·시간·용량',
    ]) {
      expect(onboardingClient).toContain(copy);
    }

    for (const styleName of [
      'brandIntroVideo',
      'roleImageWrap',
      'methodGridFull',
      'methodHeroCard',
      'methodSecondaryRow',
      'methodSecondaryCard',
      'completeAmbientScreen',
    ]) {
      expect(onboardingStyles).toContain(styleName);
    }

    expect(onboardingClient).not.toContain('addMethodIntroSeen');
    expect(onboardingClient).not.toContain('setAddMethodIntroSeen');
    expect(onboardingClient).not.toContain('addIntroAsBackground');
    expect(onboardingClient).not.toContain("activeStep === 'add_method' && !");
    expect(onboardingClient).not.toContain("activeStep === 'add_method' && addMethodIntroSeen");
    expect(onboardingStyles).not.toContain('addMethodIntroScreen');
    expect(onboardingStyles).not.toContain('onboardingShellAddIntro');
  });


  it('keeps onboarding photo and method screens in the warm frosted coral reference tone', () => {
    for (const token of [
      '--onboarding-cream: #fff8f2',
      '--onboarding-coral: #e76551',
      '--onboarding-coral-bright: #f37661',
      '--onboarding-surface: rgba(255, 252, 248, 0.86)',
      'backdrop-filter: blur(18px)',
      'var(--onboarding-shadow)',
      'linear-gradient(180deg, var(--onboarding-coral-bright) 0%, var(--onboarding-coral)',
      'var(--onboarding-coral-soft)',
    ]) {
      expect(onboardingStyles).toContain(token);
    }
    expect(onboardingStyles).not.toContain('#f47d63');
    expect(onboardingStyles).not.toContain('#d95f4c');
  });

  it('keeps sharing choice cards from fading into bland pastel blocks', () => {
    for (const token of [
      '.methodHeroCardGreen::before',
      '.sharingPartnerCard::before',
      'linear-gradient(180deg, var(--onboarding-coral-bright), var(--onboarding-coral-deep))',
      'radial-gradient(circle at 12% 28%, rgba(231, 101, 81, 0.16)',
      'radial-gradient(circle at 13% 34%, rgba(231, 101, 81, 0.11)',
      '0 0 0 8px rgba(231, 101, 81, 0.08)',
      '0 0 0 7px rgba(126, 101, 200, 0.08)',
    ]) {
      expect(onboardingStyles).toContain(token);
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
    expect(onboardingClient).toContain('반복 일정은');
    expect(onboardingClient).toContain('candidateReviewSummary');
    expect(onboardingClient).toContain('buildCandidateReviewGroups(reviewCandidates)');
    expect(onboardingClient).toContain('expandedCandidateId');
    expect(onboardingClient).toContain('필요한 일정만 수정');
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
    for (const copy of [
      '나 혼자 시작할게요',
      '먼저 내 홈에서 오늘 할 일만 확인해요',
      '파트너와 함께 쓸게요',
      '완료 후 초대 링크를 준비해요',
      '일정 후보를 만들었어요',
      '일정 후보 요약',
    ]) {
      expect(onboardingClient).toContain(copy);
    }
    for (const styleName of [
      'methodHeroCardGreen',
      'methodHeroCardGreenSelected',
      'methodHeroIconGreen',
      'sharingPartnerCard',
      'sharingPartnerCardSelected',
      'sharingPartnerIcon',
    ]) {
      expect(onboardingClient).toContain(styleName);
      expect(onboardingStyles).toContain(styleName);
    }
    expect(onboardingClient).toContain('aria-pressed={sharingChoice ===');
    expect(onboardingClient).toContain('disabled={!sharingChoice}');
    expect(onboardingClient).toContain("fetch('/api/onboarding/complete'");
    expect(onboardingClient).toContain("partnerInvite: { intent: partnerIntent }");
    expect(onboardingClient).toContain("window.location.assign(payload.redirectTo ?? '/home')");
    expect(onboardingClient).toContain("'prepare_invite'");
    expect(onboardingClient).toContain('completeAmbientScreen');
  });

  it('keeps role cards tall enough for the redesigned role select', () => {
    const roleCardBlock = onboardingStyles.slice(
      onboardingStyles.indexOf('.roleCard {'),
      onboardingStyles.indexOf('.roleCard[aria-pressed'),
    );

    expect(roleCardBlock).toContain('min-height: 240px');
    expect(roleCardBlock).toContain('border-radius: 26px !important');
    expect(onboardingStyles).toContain('width: 100px');
    expect(onboardingStyles).toContain('height: 100px');
  });

  it('does not render onboarding back buttons that can overlap copy', () => {
    expect(onboardingClient).not.toContain('<BackButton');
    expect(onboardingStyles).not.toContain('.backButton');
  });

  it('uses ambient onboarding backgrounds without foreground completion glyph clutter', () => {
    const patientCompleteBranch = onboardingClient.slice(
      onboardingClient.indexOf('completeAmbientScreen'),
      onboardingClient.indexOf('{sharingChoice ==='),
    );

    expect(onboardingStyles).not.toContain("url('/assets/slc/home-clinic-bg.png')");
    expect(onboardingStyles).toContain("url('/assets/slc/home-empty-bg.png')");
    expect(onboardingStyles).toContain('completeAmbientScreen::before');
    expect(patientCompleteBranch).not.toContain('<HeroGlyph');
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
