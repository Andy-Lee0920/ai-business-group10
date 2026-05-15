'use client';

import { type ReactNode, useMemo, useRef, useState } from 'react';
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
  { id: 'add_method', label: '추가 방식' },
  { id: 'sharing', label: '공유' },
  { id: 'complete', label: '완료' },
] as const;


const ADD_METHODS: Array<{ step: AddMethodStep; label: string; helper: string }> = [
  { step: 'photo_processing', label: '사진으로 남기기', helper: '처방지나 안내문을 찍어주세요' },
  { step: 'text_paste', label: '문자로 붙여넣기', helper: '카톡·문자 내용을 붙여넣어요' },
  { step: 'direct_entry', label: '직접 적기', helper: '이름, 시간, 용량만 간단히 적어요' },
];

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
  const [addMethodIntroSeen, setAddMethodIntroSeen] = useState(false);
  const [directType, setDirectType] = useState<DirectEntryType>('injection');
  const [directTitle, setDirectTitle] = useState('');
  const [directDate, setDirectDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [directTime, setDirectTime] = useState('09:00');
  const [directDose, setDirectDose] = useState('');
  const [directUnit, setDirectUnit] = useState('');
  const [savingDirectEntry, setSavingDirectEntry] = useState(false);
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('idle');
  const [photoMessage, setPhotoMessage] = useState('사진을 선택하면 업로드 후 내용을 분석합니다.');
  const [textPasteValue, setTextPasteValue] = useState('');
  const [analyzingText, setAnalyzingText] = useState(false);
  const [textMessage, setTextMessage] = useState<string | null>(null);
  const [reviewCandidates, setReviewCandidates] = useState<ReviewCandidate[]>([]);
  const [savedReviewItems, setSavedReviewItems] = useState<SavedScheduleItem[]>([]);
  const [sharingChoice, setSharingChoice] = useState<SharingChoice | null>(null);
  const [savingCandidates, setSavingCandidates] = useState(false);
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
  const hasMissingCandidateTime = reviewCandidates.some((candidate) => candidate.decision === 'confirmed' && !candidate.scheduled_at);
  const hasMissingCandidateDose = reviewCandidates.some((candidate) => candidate.decision === 'confirmed' && candidate.type !== 'clinic' && !candidate.dose);

  function goToStep(step: OnboardingStep) {
    setError(null);
    setActiveStep(enterOnboardingStep(step));
  }

  function goBack() {
    if (activeStep === 'add_method' && addMethodIntroSeen) {
      setAddMethodIntroSeen(false);
      return;
    }

    if (activeStep === 'add_method') {
      goToStep('role_select');
      return;
    }

    if (activeStep === 'photo_processing' || activeStep === 'text_paste' || activeStep === 'direct_entry' || activeStep === 'candidate_review') {
      setAddMethodIntroSeen(true);
      goToStep('add_method');
      return;
    }

    if (activeStep === 'sharing') {
      setAddMethodIntroSeen(true);
      goToStep('add_method');
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
      setError('시작할 역할을 선택해 주세요.');
      return;
    }

    if (selectedRole === 'partner') {
      goToStep('complete');
      return;
    }

    setTreatmentExperience((current) => current ?? 'first');
    setAddMethodIntroSeen(false);
    goToStep('add_method');
  }

  function directScheduledAt() {
    const date = directDate || new Date().toISOString().slice(0, 10);
    const time = directTime || '09:00';
    return new Date(`${date}T${time}:00+09:00`).toISOString();
  }

  async function rememberDirectEntry() {
    const title = directTitle.trim();
    if (!title) {
      setError('일정 이름을 입력해 주세요.');
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
      setError('저장하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSavingDirectEntry(false);
    }
  }


  async function processPhotoFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPhotoPhase('uploading');
    setPhotoMessage('사진을 업로드하고 있어요.');

    try {
      const formData = new FormData();
      formData.set('file', file);
      const uploadResponse = await fetch('/api/onboard/photo-upload', { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('upload_failed');
      const uploadPayload = await uploadResponse.json() as { path?: string };
      if (!uploadPayload.path) throw new Error('upload_failed');

      setPhotoPhase('uploaded');
      setPhotoMessage('업로드 완료');
      await wait(350);

      setPhotoPhase('analyzing');
      setPhotoMessage('내용 분석 중');
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
      setPhotoMessage('일정 후보 준비');
      await wait(350);
      goToStep('candidate_review');
    } catch {
      handlePhotoNotFound();
    }
  }

  function handlePhotoNotFound() {
    setPhotoPhase('not_found');
    setPhotoMessage('사진에서 일정을 찾지 못했어요');
    window.setTimeout(() => goToStep('direct_entry'), 900);
  }

  async function analyzePastedText() {
    const rawText = textPasteValue.trim();
    if (!rawText) {
      setTextMessage('병원 안내문을 붙여넣어 주세요.');
      return;
    }

    setAnalyzingText(true);
    setTextMessage('내용 분석 중');
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
        setTextMessage('일정을 찾지 못했어요');
        return;
      }

      setSavedReviewItems([]);
      setReviewCandidates(candidates);
      setTextMessage(null);
      goToStep('candidate_review');
    } catch {
      setTextMessage('일정을 찾지 못했어요');
    } finally {
      setAnalyzingText(false);
    }
  }

  function updateCandidate(id: string, patch: Partial<ReviewCandidate>) {
    setReviewCandidates((current) => current.map((candidate) => (candidate.id === id ? { ...candidate, ...patch } : candidate)));
  }

  async function confirmCandidates() {
    const confirmedIds = reviewCandidates.filter((candidate) => candidate.decision === 'confirmed').map((candidate) => candidate.id);
    const rejectedIds = reviewCandidates.filter((candidate) => candidate.decision === 'rejected').map((candidate) => candidate.id);
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
          candidateEdits: reviewCandidates.map(({ id, type, title, scheduled_at, dose, unit }) => ({ id, type, title, scheduled_at, dose, unit })),
        }),
      });
      if (!response.ok) throw new Error('confirm_failed');
      const payload = await response.json() as { items?: unknown };
      setSavedReviewItems(normalizeSavedScheduleItems(payload.items));
      goToStep('sharing');
    } catch {
      setError('일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSavingCandidates(false);
    }
  }

  function continueSharing(choice: SharingChoice) {
    setSharingChoice(choice);
    goToStep('complete');
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
      setError('완료하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setCompletingOnboarding(false);
    }
  }

  return (
    <main className={`app-shell ${styles.onboardingShell}`}>
      <div className={styles.onboardingFlow} aria-label="처음 설정 인터뷰" aria-description={progressLabel}>
        {activeStep === 'brand_intro' ? (
          <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="brand-intro-title">
            <div className={styles.brandStack}>
              <img className={styles.brandLogo} alt="Fevio" src="/assets/onboarding/fevio-logo.svg" />
              <h1 className={styles.brandIntroTitle} id="brand-intro-title">소중한 시작을,<br />Fevio와 함께</h1>
              <p className={styles.questionLead}>병원 안내를 확인한 일정으로 바꿔 조용히 챙겨드릴게요.</p>
            </div>
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} onClick={() => goToStep('role_select')} type="button">
                <span>시작하기</span><span aria-hidden="true">›</span>
              </CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'role_select' ? (
          <section className={styles.screen} aria-labelledby="role-select-title">
            <BackButton onClick={goBack} />
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="role-select-title">어떤 화면으로 시작할까요?</h2>
              <p className={styles.questionLead}>필요한 화면만 먼저 보여드릴게요.</p>
            </div>
            <div className={styles.roleGrid} role="group" aria-label="역할 선택">
              <SelectionChip className={styles.roleCard} onClick={selectPatientRole} selected={selectedRole === 'patient'} tone="sage">
                <span className={styles.roleImageWrap}><img alt="" src="/assets/onboarding/role-patient.png" /></span>
                <strong>본인</strong>
                <small>일정 확인 · 주사 기록</small>
              </SelectionChip>
              <SelectionChip className={styles.roleCard} onClick={selectPartnerRole} selected={selectedRole === 'partner'} tone="lavender">
                <span className={styles.roleImageWrap}><img alt="" src="/assets/onboarding/role-partner.png" /></span>
                <strong>파트너</strong>
                <small>일정 공유 · 확인 전용</small>
              </SelectionChip>
            </div>
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!selectedRole} onClick={continueAfterRole} type="button">
                <span>다음</span><span aria-hidden="true">›</span>
              </CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'add_method' && !addMethodIntroSeen ? (
          <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="first-add-title">
            <BackButton onClick={goBack} />
            <img className={styles.heroImage} alt="" src="/assets/slc/clinic-visit-clipboard.png" />
            <div className={styles.heroCopy}>
              <h2 className={styles.sectionTitle} id="first-add-title">병원 안내를<br />그대로 옮겨주세요</h2>
              <p className={styles.questionLead}>확인 전에는 일정으로 저장하지 않아요.</p>
            </div>
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} onClick={() => setAddMethodIntroSeen(true)} type="button">
                <span>추가하기</span><span aria-hidden="true">›</span>
              </CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'add_method' && addMethodIntroSeen ? (
          <section className={styles.screen} aria-labelledby="add-method-title">
            <BackButton onClick={goBack} />
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="add-method-title">어떻게 추가할까요?</h2>
            </div>
            <div className={styles.methodGrid} role="group" aria-label="안내 추가 방식 선택">
              {ADD_METHODS.map((method) => (
                <SelectionChip key={method.step} className={styles.methodCard} onClick={() => goToStep(method.step)} selected={false} tone={method.step === 'photo_processing' ? 'coral' : 'sage'}>
                  <MethodIcon step={method.step} />
                  <span><strong>{method.label}</strong><small>{method.helper}</small></span>
                  <i aria-hidden="true">›</i>
                </SelectionChip>
              ))}
            </div>
            <BottomDock activeIndex={activeIndex} />
          </section>
        ) : null}

        {activeStep === 'photo_processing' ? (
          <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="photo-processing-title">
            <BackButton onClick={goBack} />
            <HeroGlyph kind="document" done={photoPhase === 'uploaded' || photoPhase === 'analyzing' || photoPhase === 'ready'} />
            <div className={styles.heroCopy}>
              <h2 className={styles.sectionTitle} id="photo-processing-title">{photoPhase === 'idle' ? '사진으로 남겨주세요' : '사진을 받았어요'}</h2>
              <p className={styles.questionLead}>{photoPhase === 'idle' ? '처방지나 안내문을 찍어주시면 일정 후보로만 정리해요.' : '일정 후보를 정리하고 있어요.'}</p>
            </div>

            <input ref={cameraInputRef} className={styles.hiddenFileInput} type="file" accept="image/*" capture="environment" onChange={(event) => processPhotoFile(event.currentTarget.files?.[0])} />
            <input ref={galleryInputRef} className={styles.hiddenFileInput} type="file" accept="image/*" onChange={(event) => processPhotoFile(event.currentTarget.files?.[0])} />

            {photoPhase === 'idle' ? (
              <div className={styles.photoPickerActions}>
                <CtaButton className={styles.primaryCta} onClick={() => cameraInputRef.current?.click()} type="button">사진 찍기</CtaButton>
                <CtaButton className={styles.softCta} onClick={() => galleryInputRef.current?.click()} type="button">사진 선택</CtaButton>
              </div>
            ) : null}

            <ol className={styles.processingSteps} aria-label="사진 처리 상태">
              <li data-active={photoPhase === 'uploaded' || photoPhase === 'analyzing' || photoPhase === 'ready'}>업로드 완료</li>
              <li data-active={photoPhase === 'analyzing' || photoPhase === 'ready'}>내용 분석 중</li>
              <li data-active={photoPhase === 'ready'}>일정 후보 준비</li>
            </ol>

            {photoPhase === 'not_found' ? <Notice className={styles.notice} tone="coral">사진에서 일정을 찾지 못했어요</Notice> : null}
            {photoPhase === 'not_found' ? <CtaButton className={styles.softCta} onClick={() => setPhotoPhase('idle')} type="button">다시 찍기</CtaButton> : null}
            <BottomDock activeIndex={activeIndex} />
          </section>
        ) : null}

        {activeStep === 'text_paste' ? (
          <section className={styles.screen} aria-labelledby="text-paste-title">
            <BackButton onClick={goBack} />
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="text-paste-title">병원 안내를 붙여넣어 주세요</h2>
              <p className={styles.questionLead}>확인 전에는 일정으로 저장하지 않아요.</p>
            </div>
            <label className={styles.pasteField}>
              <span>병원 안내문</span>
              <textarea maxLength={1000} value={textPasteValue} onChange={(event) => setTextPasteValue(event.target.value)} placeholder="예: 오늘 밤 9시 고날에프 150 IU 주사" />
              <small>{textPasteValue.length}/1000</small>
            </label>
            {textMessage ? <Notice className={styles.notice} tone={textMessage === '일정을 찾지 못했어요' ? 'coral' : 'sage'}>{textMessage}</Notice> : null}
            {textMessage === '일정을 찾지 못했어요' ? <CtaButton className={styles.softCta} onClick={() => goToStep('direct_entry')} type="button">직접 입력으로 바꾸기</CtaButton> : null}
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!textPasteValue.trim() || analyzingText} onClick={analyzePastedText} type="button">{analyzingText ? '분석 중' : '분석하기'}</CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'candidate_review' ? (
          reviewCandidates.length ? (
            <section className={styles.screen} aria-labelledby="candidate-review-title">
              <BackButton onClick={goBack} />
              <div className={styles.stepHeader}>
                <p className={styles.kicker}>확인 필요</p>
                <h2 className={styles.sectionTitle} id="candidate-review-title">저장 전,<br />일정을 확인해 주세요</h2>
                <p className={styles.questionLead}>확인한 일정만 저장합니다.</p>
              </div>
              {hasMissingCandidateTime ? <Notice className={styles.notice} tone="coral">접종 시간이 아직 비어 있어요. 필요한 시간을 알려주세요.</Notice> : null}
              {hasMissingCandidateDose ? <Notice className={styles.notice} tone="sage">용량이 확인되지 않았어요. 처방지에 적힌 용량을 확인해 주세요.</Notice> : null}
              <div className={styles.candidateList}>
                {reviewCandidates.map((candidate) => (
                  <article key={candidate.id} className={styles.candidateCard} data-decision={candidate.decision}>
                    <div className={styles.candidateSummary} aria-label={`${candidate.title} 요약`}>
                      <span>{formatCandidateType(candidate.type)}</span>
                      <strong>{candidate.title || '제목을 입력해 주세요'}</strong>
                      <small>{formatCandidateDateTime(candidate.scheduled_at)} · {formatCandidateDose(candidate.dose, candidate.unit)}</small>
                    </div>
                    <div className={styles.candidateHeader}>
                      <select aria-label="종류" value={candidate.type} onChange={(event) => updateCandidate(candidate.id, { type: event.target.value as DirectEntryType })}>
                        <option value="injection">주사</option>
                        <option value="medication">약 복용</option>
                        <option value="clinic">병원 방문</option>
                      </select>
                      <div className={styles.candidateDecisionActions}>
                        <button aria-label={`${candidate.title} 확인`} type="button" onClick={() => updateCandidate(candidate.id, { decision: 'confirmed' })}>✓</button>
                        <button aria-label={`${candidate.title} 거절`} type="button" onClick={() => updateCandidate(candidate.id, { decision: 'rejected' })}>✕</button>
                      </div>
                    </div>
                    <label className={styles.directField}>
                      <span>제목</span>
                      <input value={candidate.title} onChange={(event) => updateCandidate(candidate.id, { title: event.target.value })} />
                    </label>
                    <label className={styles.directField}>
                      <span>시간</span>
                      <input type="datetime-local" value={toDateTimeLocal(candidate.scheduled_at)} onChange={(event) => updateCandidate(candidate.id, { scheduled_at: fromDateTimeLocal(event.target.value) })} />
                    </label>
                    <div className={styles.directFieldRow}>
                      <label className={styles.directField}>
                        <span>용량</span>
                        <input value={candidate.dose ?? ''} onChange={(event) => updateCandidate(candidate.id, { dose: event.target.value || null })} />
                      </label>
                      <label className={styles.directField}>
                        <span>단위</span>
                        <input value={candidate.unit ?? ''} onChange={(event) => updateCandidate(candidate.id, { unit: event.target.value || null })} />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
              <BottomDock activeIndex={activeIndex}>
                <CtaButton className={styles.primaryCta} disabled={savingCandidates || reviewCandidates.every((candidate) => candidate.decision === 'rejected')} onClick={confirmCandidates} type="button">{savingCandidates ? '저장 중' : '일정 확인하기'}</CtaButton>
              </BottomDock>
            </section>
          ) : (
            <PlaceholderStep body="확인할 후보가 아직 없습니다. 사진이나 문자를 다시 추가해 주세요." onBack={() => goToStep('add_method')} title="후보가 없어요" />
          )
        ) : null}

        {activeStep === 'direct_entry' ? (
          <section className={styles.screen} aria-labelledby="direct-entry-title">
            <BackButton onClick={goBack} />
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="direct-entry-title">기억나는 일정만 적어주세요</h2>
              <p className={styles.questionLead}>확인한 내용만 저장합니다.</p>
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

            <div className={styles.homePreviewCard} aria-label="홈 미리보기">
              <small>홈 미리보기</small>
              <strong>{directTitle.trim() || '일정 이름이 여기에 보여요'}</strong>
              <span>{directDate || '날짜'} · {directTime || '시간'} · {directType === 'injection' ? '주사' : directType === 'medication' ? '약 복용' : '병원 방문'}{directDose.trim() ? ` · ${directDose.trim()}${directUnit.trim() ? ` ${directUnit.trim()}` : ''}` : ''}</span>
            </div>

            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!directTitle.trim() || savingDirectEntry} onClick={rememberDirectEntry} type="button">{savingDirectEntry ? '저장 중' : '이 일정 기억하기'}</CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'sharing' ? (
          <section className={styles.screen} aria-labelledby="sharing-title">
            <BackButton onClick={goBack} />
            <div className={styles.stepHeader}>
              <h2 className={styles.sectionTitle} id="sharing-title">어떻게 시작할까요?</h2>
              <p className={styles.questionLead}>{savedReviewItems.length ? `${savedReviewItems[0].title} 일정이 홈에 반영되도록 저장됐어요.` : '오늘 일정은 나중에 홈에서도 추가할 수 있어요.'}</p>
            </div>
            <div className={styles.methodGrid} role="group" aria-label="파트너 공유 선택">
              <SelectionChip className={styles.methodCard} onClick={() => setSharingChoice('solo')} selected={sharingChoice === 'solo'} tone="sage">
                <MethodIcon step="direct_entry" />
                <span><strong>나 혼자 시작할게요</strong><small>먼저 내 홈에서 오늘 할 일만 확인해요.</small></span>
                <i aria-hidden="true">›</i>
              </SelectionChip>
              <SelectionChip className={styles.methodCard} onClick={() => setSharingChoice('partner')} selected={sharingChoice === 'partner'} tone="lavender">
                <MethodIcon step="text_paste" />
                <span><strong>파트너와 함께 쓸게요</strong><small>완료 후 초대 링크를 준비해요.</small></span>
                <i aria-hidden="true">›</i>
              </SelectionChip>
            </div>
            <BottomDock activeIndex={activeIndex}>
              <CtaButton className={styles.primaryCta} disabled={!sharingChoice} onClick={() => sharingChoice ? continueSharing(sharingChoice) : undefined} type="button">
                <span>다음</span><span aria-hidden="true">›</span>
              </CtaButton>
            </BottomDock>
          </section>
        ) : null}

        {activeStep === 'complete' ? (
          selectedRole === 'partner' ? (
            <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="complete-title">
              <BackButton onClick={goBack} />
              <HeroGlyph kind="document" done />
              <div className={styles.heroCopy}>
                <h2 className={styles.sectionTitle} id="complete-title">파트너는 초대 링크로 들어와 주세요</h2>
                <p className={styles.questionLead}>치료자가 보낸 링크에서 오늘 도울 일만 확인할 수 있어요.</p>
              </div>
              <Notice className={styles.notice} tone="sage">파트너 계정 없이 링크 안내만 보여드리고 온보딩을 종료합니다.</Notice>
              <BottomDock activeIndex={activeIndex}>
                <CtaButton className={styles.primaryCta} onClick={() => window.location.assign('/')} type="button">처음 화면으로 가기</CtaButton>
              </BottomDock>
            </section>
          ) : (
            <section className={`${styles.screen} ${styles.centerScreen}`} aria-labelledby="complete-title">
              <BackButton onClick={goBack} />
              <HeroGlyph kind="document" done />
              <div className={styles.heroCopy}>
                <h2 className={styles.sectionTitle} id="complete-title">일정 후보를 만들었어요</h2>
                <p className={styles.questionLead}>일정 후보를 확인하고 오늘 홈에서 만나보세요.</p>
              </div>
              <div className={styles.homePreviewCard} aria-label="일정 후보 요약">
                <small>일정 후보 요약</small>
                <strong>{savedReviewItems[0]?.title ?? '저장된 일정 없이 시작'}</strong>
                <span>{savedReviewItems[0] ? `${formatCandidateType(savedReviewItems[0].type)} · ${formatCandidateDateTime(savedReviewItems[0].scheduled_at)} · ${formatCandidateDose(savedReviewItems[0].dose, savedReviewItems[0].unit)}` : '홈에서 직접 추가할 수 있어요.'}</span>
              </div>
              {sharingChoice === 'partner' ? <Notice className={styles.notice} tone="sage">파트너 초대 링크를 준비하도록 저장합니다.</Notice> : null}
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
    decision: 'confirmed',
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

function PlaceholderStep({ body, onBack, title }: { body: string; onBack: () => void; title: string }) {
  return (
    <section className={styles.screen} aria-labelledby="placeholder-title">
      <BackButton onClick={onBack} />
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="이전" className={styles.backButton} onClick={onClick} type="button">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
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
