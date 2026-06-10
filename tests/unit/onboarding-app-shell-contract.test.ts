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

  it('renders premium brand intro, role select, photo-first capture, and partner exit', () => {
    for (const copy of [
      'Fevio',
      '소중한 시작을,',
      '시작하기',
      '어떤 역할로 함께할까요?',
      '확인한 일정은 내 홈에, 필요한 도움만 파트너 화면에 나눠 보여드려요.',
      '이전 단계로 돌아가기',
      '내 케어',
      '병원 안내 확인 · 주사 기록',
      '파트너',
      '공유된 일정 · 도움 역할',
      '초대 링크에서 파트너 도움 화면을 열어요',
      '병원 안내문을 사진으로 남겨주세요',
      '처방지나 안내문을 찍어주시면 확인할 일정 후보로만 정리해요.',
      '확인한 일정만 저장해요.',
      '안내문 찍기',
      '사진에서 선택',
      '받은 안내',
      '건너뛰기',
      '직접 적기',
      '확인한 이름·시간·용량',
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
      'backButton',
      'skipCaptureButton',
    ]) {
      expect(onboardingStyles).toContain(styleName);
    }

    expect(onboardingClient).toContain("goToStep('photo_processing')");
    expect(onboardingClient).toContain('function skipScheduleCapture()');

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

  it('keeps sharing choice cards clean and partner-forward without decorative slop', () => {
    for (const slopToken of [
      '.methodHeroCardGreen::before',
      '.sharingPartnerCard::before',
      '.methodHeroCardGreen::after',
      '.sharingPartnerCard::after',
      'radial-gradient(circle at 12% 28%, rgba(231, 101, 81',
      'radial-gradient(circle at 13% 34%, rgba(231, 101, 81',
      '0 0 0 8px',
      '0 0 0 7px',
    ]) {
      expect(onboardingStyles).not.toContain(slopToken);
    }

    for (const token of [
      "const [sharingChoice, setSharingChoice] = useState<SharingChoice | null>(\'partner\')",
      '초대 링크로 필요한 일정과 역할만 공유해요',
      'min-height: 124px',
      'min-height: 132px',
      'linear-gradient(145deg, rgba(255, 252, 248, 0.94) 0%, rgba(244, 239, 255, 0.92)',
      '0 26px 64px rgba(102, 86, 150, 0.18)',
    ]) {
      expect(`${onboardingClient}\n${onboardingStyles}`).toContain(token);
    }
  });

  it('keeps direct entry confirmation-first and preview-driven', () => {
    expect(onboardingClient).toContain('확인한 일정으로 저장');
    expect(onboardingClient).toContain("fetch('/api/schedule/add'");
    expect(onboardingClient).toContain('내 홈 미리보기');
  });

  it('implements photo processing with native image pickers, upload/analyze progress, and safe fallback', () => {
    expect(onboardingClient).toContain('type="file" accept="image/*" capture="environment"');
    expect(onboardingClient).toContain('type="file" accept="image/*"');
    expect(onboardingClient).toContain("fetch('/api/onboard/photo-upload'");
    expect(onboardingClient).toContain("fetch('/api/onboard/photo-analyze'");
    for (const copy of ['안내문 찍기', '사진에서 선택', '사진 받음', '일정 후보 정리 중', '확인 단계 준비', '사진에서 확인할 일정을 찾지 못했어요', '사진 다시 남기기']) {
      expect(onboardingClient).toContain(copy);
    }
    expect(onboardingClient).not.toContain('getUserMedia');
    expect(onboardingClient).not.toContain('camera viewport');
  });

  it('implements candidate review as a one-by-one card stack and confirm API payload', () => {
    for (const token of [
      "activeStep === 'candidate_review'",
      'currentCard = reviewCandidates[cardIndex] ?? null',
      'candidateProgressWrap',
      'candidateProgressFill',
      'candidateStackCard',
      'candidateStackFooter',
      "function advanceCard(decision: 'confirmed' | 'rejected')",
      "void confirmCandidates(updated)",
      '확인할 시간을 입력해야 저장할 수 있어요.',
      '확인한 일정으로 저장',
      '건너뛰기',
      'candidateEdits',
      'confirmedIds',
      'rejectedIds',
      "fetch('/api/onboard/candidates/confirm'",
      '확인할 일정이 없어요',
    ]) {
      expect(`${onboardingClient}\n${onboardingStyles}`).toContain(token);
    }

    for (const removedToken of [
      'CandidateReviewGroup',
      'reviewGroups',
      'activeEditCandidate',
      'expandedCandidateId',
      'buildCandidateReviewGroups',
      'formatCandidateGroupRange',
      'confirmedCandidateCount',
      'missingCandidate',
      'hasMissing',
      'candidateReviewSummary',
      'candidatePicker',
    ]) {
      expect(onboardingClient).not.toContain(removedToken);
    }
  });

  it('implements text paste analysis with a bounded textarea and candidate review reuse', () => {
    expect(onboardingClient).toContain("activeStep === 'text_paste'");
    expect(onboardingClient).toContain('maxLength={1000}');
    expect(onboardingClient).toContain('{textPasteValue.length}/1000');
    expect(onboardingClient).toContain("fetch('/api/onboard/text-analyze'");
    expect(onboardingClient).toContain('일정 후보 정리하기');
    expect(onboardingClient).toContain('확인할 일정을 찾지 못했어요');
    expect(onboardingClient).toContain('확인한 일정 직접 적기');
    expect(onboardingClient).toContain("goToStep('candidate_review')");
  });

  it('implements sharing and complete handoff with partner invite intent and home redirect', () => {
    for (const copy of [
      '내 홈만 먼저 볼게요',
      '오늘 할 일을 혼자 확인해요',
      '파트너 도움 화면도 준비할게요',
      '초대 링크로 필요한 일정과 역할만 공유해요',
      '확인할 일정 후보를 만들었어요',
      '확인할 일정 요약',
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
    expect(onboardingClient).toContain("onClick={() => continueSharing('solo')}");
    expect(onboardingClient).toContain("onClick={() => continueSharing('partner')}");
    expect(onboardingClient).toContain('function continueSharing(choice: SharingChoice)');
    expect(onboardingClient).toContain('aria-pressed={sharingChoice ===');
    expect(onboardingClient).not.toContain('disabled={!sharingChoice}');
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

  it('compacts onboarding role selection inside the desktop phone frame', () => {
    expect(onboardingStyles).toContain("body[data-iphone-frame='1']");
    const compactFrameBlock = onboardingStyles.slice(
      onboardingStyles.indexOf(":global(:where(body[data-presentation-mode='0'], body[data-iphone-frame='1'])) .screen"),
      onboardingStyles.indexOf('@media (max-height: 780px)'),
    );

    expect(compactFrameBlock).toContain('min-height: 100%');
    expect(compactFrameBlock).toContain('margin-top: 30px');
    expect(compactFrameBlock).toContain('margin-bottom: 24px');
    expect(compactFrameBlock).toContain('min-height: 196px');
    expect(compactFrameBlock).toContain('width: 84px');
    expect(compactFrameBlock).toContain('height: 84px');
    expect(compactFrameBlock).toContain('min-height: 54px !important');
  });

  it('keeps onboarding back navigation as a compact top control', () => {
    expect(onboardingClient).toContain("activeStep !== 'brand_intro'");
    expect(onboardingClient).toContain('aria-label="이전 단계로 돌아가기"');
    expect(onboardingClient).toContain('function goBack()');
    expect(onboardingStyles).toContain('.backButton');
    expect(onboardingStyles).toContain('position: absolute');
    expect(onboardingStyles).toContain('border-radius: 999px');
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
