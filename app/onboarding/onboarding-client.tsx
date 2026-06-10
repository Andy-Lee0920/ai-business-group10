'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { CtaButton, Notice, SelectionChip } from '../../src/components/ui';
import styles from './onboarding.module.css';

export type OnboardingStep = 'brand_intro' | 'role_select' | 'add_method' | 'photo_processing' | 'text_paste' | 'candidate_review' | 'direct_entry' | 'sharing' | 'complete';

type TreatmentRole = 'patient' | 'partner';
type TreatmentExperience = 'first' | 'experienced' | 'returning';
type AddMethodStep = Extract<OnboardingStep, 'photo_processing' | 'text_paste' | 'direct_entry'>;
type DirectEntryType = 'injection' | 'medication' | 'clinic';
type PhotoPhase = 'idle' | 'uploading' | 'uploaded' | 'analyzing' | 'ready' | 'not_found';
type ReviewCandidate = { id: string; type: DirectEntryType; title: string; scheduled_at: string | null; dose: string | null; unit: string | null; decision: 'confirmed' | 'rejected' };
type SavedScheduleItem = { id: string; type: DirectEntryType; title: string; scheduled_at: string; dose: string | null; unit: string | null };
type ApiCandidate = { id?: unknown; type?: unknown; title?: unknown; scheduled_at?: unknown; dose?: unknown; unit?: unknown };
type NavigationDirection = 'next' | 'back';
type SharingChoice = 'solo' | 'partner';

type StepDefinition = { id: OnboardingStep; label: string };

const STEP_ORDER = [
  'brand_intro',
  'role_select',
  'add_method',
  'photo_processing',
  'text_paste',
  'candidate_review',
  'direct_entry',
  'sharing',
  'complete',
] as const satisfies readonly OnboardingStep[];

const VISIBLE_PROGRESS_STEPS: readonly StepDefinition[] = [
  { id: 'brand_intro', label: '시작' },
  { id: 'role_select', label: '역할' },
  { id: 'add_method', label: '안내 남기기' },
  { id: 'sharing', label: '공유' },
  { id: 'complete', label: '완료' },
] as const;



export function enterOnboardingStep(step: OnboardingStep): OnboardingStep {
  return step;
}

export function exitOnboardingStep(currentStep: OnboardingStep, direction: NavigationDirection): OnboardingStep {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const targetIndex = direction === 'next'
    ? Math.min(currentIndex + 1, STEP_ORDER.length - 1)
    : Math.max(currentIndex - 1, 0);

  return STEP_ORDER[targetIndex];
}

function isVisibleProgressStep(step: OnboardingStep) {
  return VISIBLE_PROGRESS_STEPS.some((progressStep) => progressStep.id === step);
}

export function OnboardingClient() {
  const [activeStep, setActiveStep] = useState<OnboardingStep>('brand_intro');
  const [selectedRole, setSelectedRole] = useState<TreatmentRole | null>(null);
  const [treatmentExperience, setTreatmentExperience] = useState<TreatmentExperience | null>(null);
  const [directType, setDirectType] = useState<DirectEntryType>('injection');
  const [directTitle, setDirectTitle] = useState('');
  const [directDate, setDirectDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [directTime, setDirectTime] = useState('09:00');
  const [directDose, setDirectDose] = useState('');
  const [directUnit, setDirectUnit] = useState('');
  const [savingDirectEntry, setSavingDirectEntry] = useState(false);
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('idle');
  const [photoMessage, setPhotoMessage] = useState('사진을 선택하면 확인할 일정 후보로 정리해요.');
  const [textPasteValue, setTextPasteValue] = useState('');
  const [analyzingText, setAnalyzingText] = useState(false);
  const [textMessage, setTextMessage] = useState<string | null>(null);
  const [reviewCandidates, setReviewCandidates] = useState<ReviewCandidate[]>([]);
  const [savedReviewItems, setSavedReviewItems] = useState<SavedScheduleItem[]>([]);
  const [sharingChoice, setSharingChoice] = useState<SharingChoice | null>('partner');
  const [savingCandidates, setSavingCandidates] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [timeError, setTimeError] = useState(false);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressStep = useMemo(() => {
    if (isVisibleProgressStep(activeStep)) return activeStep;
    if (activeStep === 'photo_processing' || activeStep === 'text_paste' || activeStep === 'direct_entry' || activeStep === 'candidate_review') return 'add_method';
    return activeStep;
  }, [activeStep]);

  const activeIndex = VISIBLE_PROGRESS_STEPS.findIndex((step) => step.id === progressStep);
  const progressLabel = `처음 설정 ${activeIndex + 1}/${VISIBLE_PROGRESS_STEPS.length}`;
  const currentCard = reviewCandidates[cardIndex] ?? null;

  useEffect(() => {
    setCardIndex(0);
    setTimeError(false);
  }, [reviewCandidates.length]);

  function goToStep(step: OnboardingStep) {
    setError(null);
    setActiveStep(enterOnboardingStep(step));
  }

  function goBack() {
    setError(null);
    setTimeError(false);
    if (activeStep === 'role_select') {
      goToStep('brand_intro');
      return;
    }
    if (activeStep === 'add_method' || activeStep === 'photo_processing') {
      goToStep('role_select');
      return;
    }
    if (activeStep === 'text_paste' || activeStep === 'direct_entry' || activeStep === 'candidate_review') {
      goToStep('photo_processing');
      return;
    }
    if (activeStep === 'sharing') {
      goToStep('photo_processing');
      return;
    }
    if (activeStep === 'complete') {
      goToStep(selectedRole === 'partner' ? 'role_select' : 'sharing');
      return;
    }
    goToStep(exitOnboardingStep(activeStep, 'back'));
  }

  function selectPatientRole() {
    setSelectedRole('patient');
    setTreatmentExperience('first');
    setError(null);
  }

  function selectPartnerRole() {
    setSelectedRole('partner');
    setTreatmentExperience(null);
    setError(null);
  }

  function continueAfterRole() {
    if (!selectedRole) {
      setError('내 케어 화면인지 파트너 도움 화면인지 선택해 주세요.');
      return;
    }

    if (selectedRole === 'partner') {
      goToStep('complete');
      return;
    }

    setTreatmentExperience((current) => current ?? 'first');
    goToStep('photo_processing');
  }

  function directScheduledAt() {
    const date = directDate || new Date().toISOString().slice(0, 10);
    const time = directTime || '09:00';
    return new Date(`${date}T${time}:00+09:00`).toISOString();
  }

  async function rememberDirectEntry() {
    const title = directTitle.trim();
    if (!title) {
      setError('확인한 일정 이름을 입력해 주세요.');
      return;
    }

    setSavingDirectEntry(true);
    setError(null);
    try {
      const response = await fetch('/api/schedule/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: directType,
          title,
          dose: directDose.trim() || null,
          unit: directUnit.trim() || null,
          scheduledAt: directScheduledAt(),
        }),
      });
      if (!response.ok) throw new Error('save_failed');
      const payload = await response.json() as { item?: unknown };
      setSavedReviewItems(normalizeSavedScheduleItems(payload.item ? [payload.item] : []));
      goToStep('sharing');
    } catch {
      setError('확인한 일정을 저장하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSavingDirectEntry(false);
    }
  }


  async function processPhotoFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPhotoPhase('uploading');
    setPhotoMessage('안내문 사진을 받고 있어요.');

    try {
      const formData = new FormData();
      formData.set('file', file);
      const uploadResponse = await fetch('/api/onboard/photo-upload', { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('upload_failed');
      const uploadPayload = await uploadResponse.json() as { path?: string };
      if (!uploadPayload.path) throw new Error('upload_failed');

      setPhotoPhase('uploaded');
      setPhotoMessage('사진 받음');
      await wait(350);

      setPhotoPhase('analyzing');
      setPhotoMessage('일정 후보 정리 중');
      const analyzeResponse = await fetch('/api/onboard/photo-analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imagePath: uploadPayload.path }),
      });
      if (!analyzeResponse.ok) throw new Error('analyze_failed');
      const analyzePayload = await analyzeResponse.json() as { candidates?: ApiCandidate[] };
      const candidates = normalizeReviewCandidates(analyzePayload.candidates);

      if (candidates.length === 0) {
        handlePhotoNotFound();
        return;
      }

      setSavedReviewItems([]);
      setReviewCandidates(candidates);
      setPhotoPhase('ready');
      setPhotoMessage('확인 단계 준비');
      await wait(350);
      goToStep('candidate_review');
    } catch {
      handlePhotoNotFound();
    }
  }

  function handlePhotoNotFound() {
    setPhotoPhase('not_found');
    setPhotoMessage('사진에서 확인할 일정을 찾지 못했어요');
    window.setTimeout(() => goToStep('direct_entry'), 900);
  }

  async function analyzePastedText() {
    const rawText = textPasteValue.trim();
    if (!rawText) {
      setTextMessage('받은 병원 안내를 붙여넣어 주세요.');
      return;
    }

    setAnalyzingText(true);
    setTextMessage('일정 후보 정리 중');
    setError(null);
    try {
      const response = await fetch('/api/onboard/text-analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      if (!response.ok) throw new Error('text_analyze_failed');
      const payload = await response.json() as { candidates?: ApiCandidate[] };
      const candidates = normalizeReviewCandidates(payload.candidates);
      if (!candidates.length) {
        setTextMessage('확인할 일정을 찾지 못했어요');
        return;
      }

      setSavedReviewItems([]);
      setReviewCandidates(candidates);
      setTextMessage(null);
      goToStep('candidate_review');
    } catch {
      setTextMessage('확인할 일정을 찾지 못했어요');
    } finally {
      setAnalyzingText(false);
    }
  }

  function updateCandidate(id: string, patch: Partial<ReviewCandidate>) {
    setReviewCandidates((current) => current.map((candidate) => (candidate.id === id ? { ...candidate, ...patch } : candidate)));
  }

  async function confirmCandidates(override?: ReviewCandidate[]) {
    const candidates = override ?? reviewCandidates;
    const confirmedIds = candidates.filter((candidate) => candidate.decision === 'confirmed').map((candidate) => candidate.id);
    const rejectedIds = candidates.filter((candidate) => candidate.decision === 'rejected').map((candidate) => candidate.id);
    if (confirmedIds.length === 0) {
      setError('확인할 일정을 하나 이상 선택해 주세요.');
      return;
    }

    setSavingCandidates(true);
    setError(null);
    try {
      const response = await fetch('/api/onboard/candidates/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          confirmedIds,
          rejectedIds,
          candidateEdits: candidates.map(({ id, type, title, scheduled_at, dose, unit }) => ({ id, type, title, scheduled_at, dose, unit })),
        }),
      });
      if (!response.ok) throw new Error('confirm_failed');
      const payload = await response.json() as { items?: unknown };
      setSavedReviewItems(normalizeSavedScheduleItems(payload.items));
      goToStep('sharing');
    } catch {
      setError('확인한 일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSavingCandidates(false);
    }
  }

  function advanceCard(decision: 'confirmed' | 'rejected') {
    if (!currentCard) return;
    if (decision === 'confirmed' && !currentCard.scheduled_at) {
      setTimeError(true);
      return;
    }
    setTimeError(false);

    const updated = reviewCandidates.map((candidate) => (
      candidate.id === currentCard.id ? { ...candidate, decision } : candidate
    ));
    setReviewCandidates(updated);

    const next = cardIndex + 1;
    if (next >= reviewCandidates.length) {
      void confirmCandidates(updated);
    } else {
      setCardIndex(next);
    }
  }

  function continueSharing(choice: SharingChoice) {
    setSharingChoice(choice);
    goToStep('complete');
  }

  function skipScheduleCapture() {
    setSavedReviewItems([]);
    setReviewCandidates([]);
    setTextMessage(null);
    setPhotoPhase('idle');
    goToStep('sharing');
  }

  async function completeOnboarding() {
    const partnerIntent = sharingChoice === 'partner' ? 'prepare_invite' : 'skip';
    setCompletingOnboarding(true);
    setError(null);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          treatmentContext: 'onboarding_capture_completed',
          treatmentExperience,
          roleContext: sharingChoice === 'partner' ? 'primary_with_partner' : 'primary_solo',
          partnerInvite: { intent: partnerIntent },
        }),
      });
      if (!response.ok) throw new Error('complete_failed');
      const payload = await response.json() as { redirectTo?: string };
      window.location.assign(payload.redirectTo ?? '/home');
    } catch {
      setError('온보딩을 마치지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setCompletingOnboarding(false);
    }
  }

  return (
    <main className={`app-shell ${styles.onboardingShell}`}>
      <div className={styles.onboardingFlow} aria-label="처음 설정 인터뷰" aria-description={progressLabel}>
        {activeStep !== 'brand_intro' ? (
          <button className={styles.backButton} onClick={goBack} type="button" aria-label="이전 단계로 돌아가기">
            <span aria-hidden="true">‹</span>
            <strong>이전</strong>
          </button>
        ) : null}

        {activeStep === 'brand_intro' ? (
          <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="brand-intro-title">
            <div className={styles.brandStack}>
              <img className={styles.brandLogo} alt="Fevio" src="/assets/onboarding/fevio-logo.svg" />
              <h1 className={styles.brandIntroTitle} id="brand-intro-title">소중한 시작을,<br />Fevio와 함께</h1>
              <p className={styles.questionLead}>병원 안내를 확인한 일정으로 바꿔 조용히 챙겨둘게요.</p>
            </div>
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} onClick={() => goToStep('role_select')} type="button">
                <span>시작하기</span><span aria-hidden="true">›</span>
              </CtaButton>
            </BottomDock>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              className={styles.brandIntroVideo}
              src="/assets/onboarding/intro-bg.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          </section>
        ) : null}

        {activeStep === 'role_select' ? (
          <section className={styles.screen} aria-labelledby="role-select-title">
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="role-select-title">어떤 역할로 함께할까요?</h2>
              <p className={styles.questionLead}>확인한 일정은 내 홈에, 필요한 도움만 파트너 화면에 나눠 보여드려요.</p>
            </div>
            <div className={styles.roleGrid} role="group" aria-label="역할 선택">
              <SelectionChip className={styles.roleCard} onClick={selectPatientRole} selected={selectedRole === 'patient'} tone="sage">
                <span className={styles.roleImageWrap}><img alt="" src="/assets/onboarding/role-patient.png" /></span>
                <strong>내 케어</strong>
                <small>병원 안내 확인 · 주사 기록</small>
              </SelectionChip>
              <SelectionChip className={styles.roleCard} onClick={selectPartnerRole} selected={selectedRole === 'partner'} tone="lavender">
                <span className={styles.roleImageWrap}><img alt="" src="/assets/onboarding/role-partner.png" /></span>
                <strong>파트너</strong>
                <small>공유된 일정 · 도움 역할</small>
              </SelectionChip>
            </div>
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!selectedRole} onClick={continueAfterRole} type="button">
                <span>다음</span><span aria-hidden="true">›</span>
              </CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'add_method' ? (
          <section className={styles.screen} aria-labelledby="add-method-title">
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="add-method-title">병원 안내를 어떻게 남길까요?</h2>
              <p className={styles.questionLead}>확인한 일정만 저장해요.</p>
            </div>
            <div className={styles.methodGridFull} role="group" aria-label="병원 안내 남기는 방식 선택">
              <button
                type="button"
                className={styles.methodHeroCard}
                onClick={() => goToStep('photo_processing')}
                aria-label="안내문 사진으로 남기기"
              >
                <span className={styles.methodHeroIcon}>
                  <MethodIcon step="photo_processing" />
                </span>
                <span className={styles.methodHeroText}>
                  <strong>안내문 사진으로 남기기</strong>
                  <small>처방지나 병원 안내문을 찍어주세요</small>
                </span>
                <i aria-hidden="true">›</i>
              </button>
              <div className={styles.methodSecondaryRow}>
                <button
                  type="button"
                  className={styles.methodSecondaryCard}
                  onClick={() => goToStep('text_paste')}
                  aria-label="받은 안내 문자로 붙여넣기"
                >
                  <span className={styles.methodSecondaryIcon}>
                    <MethodIcon step="text_paste" />
                  </span>
                  <strong>받은 안내</strong>
                  <small>문자로 붙여넣기</small>
                </button>
                <button
                  type="button"
                  className={styles.methodSecondaryCard}
                  onClick={() => goToStep('direct_entry')}
                  aria-label="확인한 일정 직접 적기"
                >
                  <span className={styles.methodSecondaryIcon}>
                    <MethodIcon step="direct_entry" />
                  </span>
                  <strong>직접 적기</strong>
                  <small>확인한 이름·시간·용량</small>
                </button>
              </div>
            </div>
            <BottomDock activeIndex={activeIndex} />
          </section>
        ) : null}

        {activeStep === 'photo_processing' ? (
          <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="photo-processing-title">
            <HeroGlyph kind="document" done={photoPhase === 'uploaded' || photoPhase === 'analyzing' || photoPhase === 'ready'} />
            <div className={styles.heroCopy}>
              <h2 className={styles.sectionTitle} id="photo-processing-title">{photoPhase === 'idle' ? '병원 안내문을 사진으로 남겨주세요' : '안내문 사진을 받았어요'}</h2>
              <p className={styles.questionLead}>{photoPhase === 'idle' ? '처방지나 안내문을 찍어주시면 확인할 일정 후보로만 정리해요.' : '확인할 일정 후보로 정리하고 있어요.'}</p>
            </div>

            <input ref={cameraInputRef} className={styles.hiddenFileInput} type="file" accept="image/*" capture="environment" onChange={(event) => processPhotoFile(event.currentTarget.files?.[0])} />
            <input ref={galleryInputRef} className={styles.hiddenFileInput} type="file" accept="image/*" onChange={(event) => processPhotoFile(event.currentTarget.files?.[0])} />

            {photoPhase === 'idle' ? (
              <div className={styles.photoPickerActions}>
                <CtaButton className={styles.primaryCta} onClick={() => cameraInputRef.current?.click()} type="button">안내문 찍기</CtaButton>
                <CtaButton className={styles.softCta} onClick={() => galleryInputRef.current?.click()} type="button">사진에서 선택</CtaButton>
              </div>
            ) : null}

            <ol className={styles.processingSteps} aria-label="사진 처리 상태">
              <li data-active={photoPhase === 'uploaded' || photoPhase === 'analyzing' || photoPhase === 'ready'}>사진 받음</li>
              <li data-active={photoPhase === 'analyzing' || photoPhase === 'ready'}>일정 후보 정리 중</li>
              <li data-active={photoPhase === 'ready'}>확인 단계 준비</li>
            </ol>

            {photoPhase === 'not_found' ? <Notice className={styles.notice} tone="coral">사진에서 확인할 일정을 찾지 못했어요</Notice> : null}
            {photoPhase === 'not_found' ? <CtaButton className={styles.softCta} onClick={() => setPhotoPhase('idle')} type="button">사진 다시 남기기</CtaButton> : null}
            <BottomDock activeIndex={activeIndex}>
              <button className={styles.skipCaptureButton} onClick={skipScheduleCapture} type="button">
                건너뛰기<span aria-hidden="true">›</span>
              </button>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'text_paste' ? (
          <section className={styles.screen} aria-labelledby="text-paste-title">
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="text-paste-title">받은 병원 안내를 붙여넣어 주세요</h2>
              <p className={styles.questionLead}>확인한 일정만 저장해요.</p>
            </div>
            <label className={styles.pasteField}>
              <span>받은 안내</span>
              <textarea maxLength={1000} value={textPasteValue} onChange={(event) => setTextPasteValue(event.target.value)} placeholder="예: 오늘 밤 9시 고날에프 150 IU 주사" />
              <small>{textPasteValue.length}/1000</small>
            </label>
            {textMessage ? <Notice className={styles.notice} tone={textMessage === '확인할 일정을 찾지 못했어요' ? 'coral' : 'sage'}>{textMessage}</Notice> : null}
            {textMessage === '확인할 일정을 찾지 못했어요' ? <CtaButton className={styles.softCta} onClick={() => goToStep('direct_entry')} type="button">확인한 일정 직접 적기</CtaButton> : null}
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!textPasteValue.trim() || analyzingText} onClick={analyzePastedText} type="button">{analyzingText ? '정리 중' : '일정 후보 정리하기'}</CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'candidate_review' ? (
          reviewCandidates.length ? (
            <section className={styles.screen} aria-labelledby="candidate-review-title">
              <div className={styles.candidateProgressWrap} aria-hidden="true">
                <div
                  className={styles.candidateProgressFill}
                  style={{ width: `${((cardIndex + 1) / reviewCandidates.length) * 100}%` }}
                />
              </div>

              <div className={styles.stepHeader}>
                <p className={styles.kicker}>확인 후 저장</p>
                <p className={styles.questionLead} id="candidate-review-title">
                  {cardIndex + 1} / {reviewCandidates.length}
                </p>
              </div>

              {currentCard ? (
                <article className={styles.candidateStackCard} aria-label="확인할 일정 후보">
                  <p className={styles.candidateTypeBadge}>
                    {formatCandidateType(currentCard.type)} · {cardIndex + 1}회차
                  </p>

                  <h2 className={styles.candidateCardTitle}>
                    {currentCard.title || '일정 이름을 확인해 주세요'}
                  </h2>

                  <div className={styles.candidateFieldGroup}>
                    <span className={styles.candidateFieldLabel}>시간</span>
                    <input
                      aria-label="일정 시간"
                      className={`${styles.candidateFieldInput} ${
                        !currentCard.scheduled_at
                          ? timeError
                            ? styles.candidateFieldInputError
                            : styles.candidateFieldInputEmpty
                          : ''
                      }`}
                      onChange={(event) => {
                        updateCandidate(currentCard.id, { scheduled_at: fromDateTimeLocal(event.target.value) });
                        setTimeError(false);
                      }}
                      placeholder="시간 입력 ›"
                      type="datetime-local"
                      value={toDateTimeLocal(currentCard.scheduled_at)}
                    />
                  </div>

                  <div className={styles.candidateFieldRow}>
                    <div className={styles.candidateFieldGroup}>
                      <span className={styles.candidateFieldLabel}>용량</span>
                      <input
                        aria-label="용량"
                        className={`${styles.candidateFieldInput} ${!currentCard.dose ? styles.candidateFieldInputEmpty : ''}`}
                        onChange={(event) => updateCandidate(currentCard.id, { dose: event.target.value || null })}
                        placeholder="예: 150"
                        value={currentCard.dose ?? ''}
                      />
                    </div>
                    <div className={styles.candidateFieldGroup}>
                      <span className={styles.candidateFieldLabel}>단위</span>
                      <input
                        aria-label="단위"
                        className={`${styles.candidateFieldInput} ${!currentCard.unit ? styles.candidateFieldInputEmpty : ''}`}
                        onChange={(event) => updateCandidate(currentCard.id, { unit: event.target.value || null })}
                        placeholder="예: IU"
                        value={currentCard.unit ?? ''}
                      />
                    </div>
                  </div>

                  {timeError ? (
                    <p role="alert" className={styles.candidateFieldError}>
                      확인할 시간을 입력해야 저장할 수 있어요.
                    </p>
                  ) : null}
                </article>
              ) : null}

              {error ? <p role="alert" className={styles.notice}>{error}</p> : null}

              <BottomDock activeIndex={activeIndex}>
                <div className={styles.candidateStackFooter}>
                  <button
                    className={styles.candidateSkipBtn}
                    disabled={savingCandidates}
                    onClick={() => advanceCard('rejected')}
                    type="button"
                  >
                    건너뛰기
                  </button>
                  <CtaButton
                    className={styles.candidateSaveBtn}
                    disabled={savingCandidates}
                    onClick={() => advanceCard('confirmed')}
                    type="button"
                  >
                    {savingCandidates ? '저장 중' : '확인한 일정으로 저장'}
                  </CtaButton>
                </div>
              </BottomDock>
            </section>
          ) : (
            <PlaceholderStep
              body="사진이나 문자에서 확인할 일정을 찾지 못했어요. 직접 적어도 괜찮아요."
              title="확인할 일정이 없어요"
            />
          )
        ) : null}

        {activeStep === 'direct_entry' ? (
          <section className={styles.screen} aria-labelledby="direct-entry-title">
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="direct-entry-title">확인한 일정만 직접 적어주세요</h2>
              <p className={styles.questionLead}>병원에서 확인한 이름과 시간만 남겨요.</p>
            </div>

            <div className={styles.segmentGrid} role="group" aria-label="일정 종류 선택">
              {(['injection', 'medication', 'clinic'] as const).map((type) => (
                <SelectionChip key={type} className={styles.segmentChip} onClick={() => setDirectType(type)} selected={directType === type} tone={type === 'clinic' ? 'lavender' : 'sage'}>
                  <span>{type === 'injection' ? '주사' : type === 'medication' ? '약 복용' : '병원 방문'}</span>
                </SelectionChip>
              ))}
            </div>

            <div className={styles.profileGrid}>
              <label className={styles.directField}>
                <span>일정 이름</span>
                <input value={directTitle} onChange={(event) => setDirectTitle(event.target.value)} placeholder="예: 고날에프 주사" />
              </label>
              <div className={styles.directFieldRow}>
                <label className={styles.directField}>
                  <span>날짜</span>
                  <input type="date" value={directDate} onChange={(event) => setDirectDate(event.target.value)} />
                </label>
                <label className={styles.directField}>
                  <span>시간</span>
                  <input type="time" value={directTime} onChange={(event) => setDirectTime(event.target.value)} />
                </label>
              </div>
              <div className={styles.directFieldRow}>
                <label className={styles.directField}>
                  <span>용량</span>
                  <input inputMode="decimal" value={directDose} onChange={(event) => setDirectDose(event.target.value)} placeholder="150" />
                </label>
                <label className={styles.directField}>
                  <span>단위</span>
                  <input value={directUnit} onChange={(event) => setDirectUnit(event.target.value)} placeholder="IU" />
                </label>
              </div>
            </div>

            <div className={styles.homePreviewCard} aria-label="내 홈 미리보기">
              <small>내 홈 미리보기</small>
              <strong>{directTitle.trim() || '확인한 일정이 여기에 보여요'}</strong>
              <span>{directDate || '날짜'} · {directTime || '시간'} · {directType === 'injection' ? '주사' : directType === 'medication' ? '약 복용' : '병원 방문'}{directDose.trim() ? ` · ${directDose.trim()}${directUnit.trim() ? ` ${directUnit.trim()}` : ''}` : ''}</span>
            </div>

            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!directTitle.trim() || savingDirectEntry} onClick={rememberDirectEntry} type="button">{savingDirectEntry ? '저장 중' : '확인한 일정으로 저장'}</CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'sharing' ? (
          <section className={`${styles.screen} ${styles.sharingScreen}`} aria-labelledby="sharing-title">
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="sharing-title">공유 범위를 정할까요?</h2>
              <p className={styles.questionLead}>
                {savedReviewItems.length
                  ? `${savedReviewItems[0].title} 일정이 내 홈에 반영되도록 저장됐어요.`
                  : '확인한 일정은 나중에 내 홈에서도 남길 수 있어요.'}
              </p>
            </div>
            <div className={styles.methodGridFull} role="group" aria-label="파트너 공유 선택">
              <button
                type="button"
                className={`${styles.methodHeroCard} ${styles.methodHeroCardGreen} ${sharingChoice === 'solo' ? styles.methodHeroCardGreenSelected : ''}`}
                onClick={() => continueSharing('solo')}
                aria-pressed={sharingChoice === 'solo'}
                aria-label="내 홈만 먼저 볼게요"
              >
                <span className={`${styles.methodHeroIcon} ${styles.methodHeroIconGreen}`}>
                  <MethodIcon step="direct_entry" />
                </span>
                <span className={styles.methodHeroText}>
                  <strong>내 홈만 먼저 볼게요</strong>
                  <small>오늘 할 일을 혼자 확인해요</small>
                </span>
                <i aria-hidden="true">›</i>
              </button>
              <button
                type="button"
                className={`${styles.sharingPartnerCard} ${sharingChoice === 'partner' ? styles.sharingPartnerCardSelected : ''}`}
                onClick={() => continueSharing('partner')}
                aria-pressed={sharingChoice === 'partner'}
                aria-label="파트너 도움 화면도 준비할게요"
              >
                <span className={styles.sharingPartnerIcon}>
                  <MethodIcon step="text_paste" />
                </span>
                <span className={styles.sharingPartnerText}>
                  <strong>파트너 도움 화면도 준비할게요</strong>
                  <small>초대 링크로 필요한 일정과 역할만 공유해요</small>
                </span>
                <i aria-hidden="true">›</i>
              </button>
            </div>
            <BottomDock activeIndex={activeIndex} />
          </section>
        ) : null}

        {activeStep === 'complete' ? (
          selectedRole === 'partner' ? (
            <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="complete-title">
              <HeroGlyph kind="document" done />
              <div className={styles.heroCopy}>
                <h2 className={styles.sectionTitle} id="complete-title">초대 링크에서 파트너 도움 화면을 열어요</h2>
                <p className={styles.questionLead}>파트너는 공유된 일정과 오늘 도울 일만 확인해요.</p>
              </div>
              <Notice className={styles.notice} tone="sage">원문 안내와 민감한 메모는 파트너 화면에 보내지 않아요.</Notice>
              <BottomDock activeIndex={activeIndex}>
                <CtaButton className={styles.primaryCta} onClick={() => window.location.assign('/')} type="button">처음 화면으로 가기</CtaButton>
              </BottomDock>
            </section>
          ) : (
            <section className={`${styles.screen} ${styles.centerScreen} ${styles.completeAmbientScreen}`} aria-labelledby="complete-title">
              <div className={styles.heroCopy}>
                <h2 className={styles.sectionTitle} id="complete-title">확인할 일정 후보를 만들었어요</h2>
                <p className={styles.questionLead}>저장 전 확인을 마치면 오늘 홈에 반영돼요.</p>
              </div>
              <div className={styles.homePreviewCard} aria-label="확인할 일정 요약">
                <small>확인할 일정 요약</small>
                <strong>{savedReviewItems[0]?.title ?? '아직 저장된 일정이 없어요'}</strong>
                <span>{savedReviewItems[0] ? `${formatCandidateType(savedReviewItems[0].type)} · ${formatCandidateDateTime(savedReviewItems[0].scheduled_at)} · ${formatCandidateDose(savedReviewItems[0].dose, savedReviewItems[0].unit)}` : '확인한 일정은 홈에서 직접 남길 수 있어요.'}</span>
              </div>
              {sharingChoice === 'partner' ? <Notice className={styles.notice} tone="sage">파트너 도움 화면 초대 링크를 준비해둘게요.</Notice> : null}
              <BottomDock activeIndex={activeIndex}>
                <CtaButton className={styles.primaryCta} disabled={completingOnboarding} onClick={completeOnboarding} type="button">
                  <span>{completingOnboarding ? '완료 중' : '시작하기'}</span><span aria-hidden="true">›</span>
                </CtaButton>
              </BottomDock>
            </section>
          )
        ) : null}

        {error ? <Notice className={styles.floatingError} tone="coral">{error}</Notice> : null}
      </div>
    </main>
  );
}


function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeReviewCandidates(value: unknown): ReviewCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.map((candidate, index) => normalizeReviewCandidate(candidate, index)).filter((candidate): candidate is ReviewCandidate => candidate !== null);
}

function normalizeReviewCandidate(value: unknown, index: number): ReviewCandidate | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as ApiCandidate;
  const type = candidate.type === 'injection' || candidate.type === 'medication' || candidate.type === 'clinic' ? candidate.type : null;
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!type || !title) return null;
  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : `candidate-${index + 1}`,
    type,
    title,
    scheduled_at: typeof candidate.scheduled_at === 'string' ? candidate.scheduled_at : null,
    dose: typeof candidate.dose === 'string' && candidate.dose.trim() ? candidate.dose.trim() : null,
    unit: typeof candidate.unit === 'string' && candidate.unit.trim() ? candidate.unit.trim() : null,
    decision: 'rejected',
  };
}

function normalizeSavedScheduleItems(value: unknown): SavedScheduleItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): SavedScheduleItem | null => {
      if (!item || Array.isArray(item) || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const type = row.type === 'injection' || row.type === 'medication' || row.type === 'clinic' ? row.type : null;
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      const scheduledAt = typeof row.scheduled_at === 'string' ? row.scheduled_at : '';
      if (!type || !title || !scheduledAt) return null;
      return {
        id: typeof row.id === 'string' ? row.id : title,
        type,
        title,
        scheduled_at: scheduledAt,
        dose: typeof row.dose === 'string' && row.dose.trim() ? row.dose.trim() : null,
        unit: typeof row.unit === 'string' && row.unit.trim() ? row.unit.trim() : null,
      };
    })
    .filter((item): item is SavedScheduleItem => item !== null);
}

function toDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatCandidateType(type: DirectEntryType) {
  if (type === 'injection') return '주사';
  if (type === 'medication') return '약 복용';
  return '병원 방문';
}

function formatCandidateDateTime(value: string | null) {
  if (!value) return '시간 확인 필요';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '시간 확인 필요';
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatCandidateDose(dose: string | null, unit: string | null) {
  if (!dose && !unit) return '용량 미입력';
  return `${dose ?? ''}${dose && unit ? ' ' : ''}${unit ?? ''}`.trim();
}

function PlaceholderStep({ body, title }: { body: string; title: string }) {
  return (
    <section className={styles.screen} aria-labelledby="placeholder-title">
      <div className={styles.stepHeader}>
        <p className={styles.kicker}>준비 중</p>
        <h2 className={styles.sectionTitle} id="placeholder-title">{title}</h2>
        <p className={styles.questionLead}>{body}</p>
      </div>
      <BottomDock activeIndex={2}>
        <CtaButton className={styles.primaryCta} disabled type="button">확인 후 계속</CtaButton>
      </BottomDock>
    </section>
  );
}

function BottomDock({ activeIndex, children }: { activeIndex: number; children?: ReactNode }) {
  return (
    <div className={styles.bottomDock}>
      <ProgressDots activeIndex={activeIndex} />
      {children}
    </div>
  );
}

function ProgressDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className={styles.progressDots} aria-hidden="true">
      {VISIBLE_PROGRESS_STEPS.map((step, index) => <span key={step.id} data-active={index === activeIndex} />)}
    </div>
  );
}

function HeroGlyph({ kind, done = false }: { kind: 'calendar' | 'document'; done?: boolean }) {
  return (
    <span className={styles.heroGlyph} data-kind={kind} aria-hidden="true">
      {kind === 'calendar' ? (
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect x="12" y="16" width="40" height="40" rx="10" fill="#FFF7F2" />
          <path d="M22 13v9M42 13v9M19 30h26M25 39h2M33 39h2M41 39h2M25 47h2M33 47h2M41 47h2" stroke="#D8624D" strokeWidth="3" strokeLinecap="round" />
          <circle cx="51" cy="48" r="15" fill="url(#calendarGradient)" />
          <path d="M51 41v14M44 48h14" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
          <defs><linearGradient id="calendarGradient" x1="40" y1="35" x2="62" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#F58A70"/><stop offset="1" stopColor="#D35C48"/></linearGradient></defs>
        </svg>
      ) : (
        <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
          <circle cx="41" cy="41" r="38" fill="#FFF7F2" />
          <rect x="27" y="20" width="30" height="38" rx="7" fill="white" />
          <path d="M35 32h14M35 41h14M35 50h9" stroke="#E2BBAE" strokeWidth="3" strokeLinecap="round" />
          <circle cx="58" cy="56" r="15" fill="url(#documentGradient)" />
          <path d="m52 55 4 4 8-9" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          {done ? <circle cx="24" cy="25" r="2" fill="#EFD6CA" /> : null}
          <defs><linearGradient id="documentGradient" x1="47" y1="43" x2="69" y2="69" gradientUnits="userSpaceOnUse"><stop stopColor="#F58A70"/><stop offset="1" stopColor="#D35C48"/></linearGradient></defs>
        </svg>
      )}
    </span>
  );
}

function MethodIcon({ step }: { step: AddMethodStep }) {
  const path = step === 'photo_processing'
    ? 'M5 9.5h4l1.4-2h7.2l1.4 2h4v11H5v-11Zm9 8a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z'
    : step === 'text_paste'
      ? 'M7 4.5h9l5 5v14H7v-19Zm9 0v5h5M10.5 14h7M10.5 18h7'
      : 'M6 19.5 18.8 6.7a3 3 0 0 1 4.2 4.2L10.2 23.7 5 25l1-5.5Z';

  return (
    <span className={styles.methodIcon} aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
