'use client';

import { useMemo, useRef, useState } from 'react';
import { CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';
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

const EXPERIENCE_OPTIONS: Array<{ value: TreatmentExperience; label: string; helper: string }> = [
  { value: 'first', label: '처음', helper: '처음이라면 설명을 조금 더 자세히 보여드려요.' },
  { value: 'experienced', label: '해본 적 있음', helper: '익숙한 흐름은 핵심 확인 위주로 정리해요.' },
  { value: 'returning', label: '다시 준비 중', helper: '이전 경험과 이번 안내를 구분해 시작해요.' },
];

const ADD_METHODS: Array<{ step: AddMethodStep; label: string; helper: string }> = [
  { step: 'photo_processing', label: '사진으로 남기기', helper: '처방전이나 병원 메모를 사진으로 보관해요.' },
  { step: 'text_paste', label: '문자로 붙여넣기', helper: '문자·카톡 안내를 붙여넣고 확인해요.' },
  { step: 'direct_entry', label: '직접 적기', helper: '기억나는 일정이나 할 일을 직접 남겨요.' },
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
  const [directType, setDirectType] = useState<DirectEntryType>('injection');
  const [directTitle, setDirectTitle] = useState('');
  const [directDate, setDirectDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [directTime, setDirectTime] = useState('09:00');
  const [directDose, setDirectDose] = useState('');
  const [directUnit, setDirectUnit] = useState('');
  const [savingDirectEntry, setSavingDirectEntry] = useState(false);
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('idle');
  const [photoMessage, setPhotoMessage] = useState('사진을 선택하면 업로드 후 내용을 분석합니다.');
  const [reviewCandidates, setReviewCandidates] = useState<ReviewCandidate[]>([]);
  const [savedReviewItems, setSavedReviewItems] = useState<SavedScheduleItem[]>([]);
  const [savingCandidates, setSavingCandidates] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressStep = useMemo(() => {
    if (isVisibleProgressStep(activeStep)) return activeStep;
    if (activeStep === 'photo_processing' || activeStep === 'text_paste' || activeStep === 'direct_entry' || activeStep === 'candidate_review') return 'add_method';
    return activeStep;
  }, [activeStep]);

  const activeIndex = VISIBLE_PROGRESS_STEPS.findIndex((step) => step.id === progressStep);
  const progress = Math.round(((activeIndex + 1) / VISIBLE_PROGRESS_STEPS.length) * 100);
  const progressLabel = `처음 설정 ${activeIndex + 1}/${VISIBLE_PROGRESS_STEPS.length}`;

  function goToStep(step: OnboardingStep) {
    setError(null);
    setActiveStep(enterOnboardingStep(step));
  }

  function goBack() {
    if (activeStep === 'add_method') {
      goToStep('role_select');
      return;
    }

    if (activeStep === 'photo_processing' || activeStep === 'text_paste' || activeStep === 'direct_entry') {
      goToStep('add_method');
      return;
    }

    goToStep(exitOnboardingStep(activeStep, 'back'));
  }

  function selectPatientRole() {
    setSelectedRole('patient');
    setError(null);
  }

  function selectPartnerRole() {
    setSelectedRole('partner');
    setTreatmentExperience(null);
    goToStep('complete');
  }

  function continueAfterExperience() {
    if (!treatmentExperience) {
      setError('치료 경험을 하나 선택해 주세요.');
      return;
    }

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

  return (
    <div className={styles.onboardingFlow} aria-label="처음 설정 인터뷰">
      <div className={styles.interviewProgress} aria-label={progressLabel}>
        <span>{activeIndex + 1}/{VISIBLE_PROGRESS_STEPS.length}</span>
        <div className={styles.progressTrack} aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
        <small>{VISIBLE_PROGRESS_STEPS[activeIndex]?.label}</small>
      </div>

      {activeStep === 'brand_intro' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide} ${styles.brandIntroStep}`} aria-labelledby="brand-intro-title">
          <div className={styles.logoMark} aria-label="Fevio logo"><img alt="" aria-hidden="true" src="/assets/onboarding/fevio-logo.svg" />Fevio</div>
          <h1 className={styles.brandIntroTitle} id="brand-intro-title">오늘 필요한 것만 보여드릴게요</h1>
          <p className={styles.questionLead}>병원 안내를 사용자가 확인한 할 일로 바꾸고, 지금 필요한 화면만 먼저 보여드려요.</p>
          <CtaButton onClick={() => goToStep('role_select')} type="button">시작하기</CtaButton>
        </section>
      ) : null}

      {activeStep === 'role_select' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="role-select-title">
          <StatusBadge state="shared">역할 선택</StatusBadge>
          <h2 className={styles.sectionTitle} id="role-select-title">누구로 시작할까요?</h2>
          <p className={styles.questionLead}>치료자는 병원 안내를 추가하고, 파트너는 초대 링크 안내를 확인합니다.</p>
          <div className={styles.choiceGrid} role="group" aria-label="역할 선택">
            <SelectionChip className={styles.choiceChip} onClick={selectPatientRole} selected={selectedRole === 'patient'} tone="sage">
              <span>치료자</span>
              <small>내 병원 안내를 추가하고 오늘 필요한 할 일을 확인해요.</small>
            </SelectionChip>
            <SelectionChip className={styles.choiceChip} onClick={selectPartnerRole} selected={selectedRole === 'partner'} tone="lavender">
              <span>파트너</span>
              <small>치료자가 보낸 초대 링크로 들어오면 오늘 도울 일을 볼 수 있어요.</small>
            </SelectionChip>
          </div>

          {selectedRole === 'patient' ? (
            <div className={styles.subStepPanel} aria-labelledby="experience-title">
              <h3 id="experience-title">치료 경험을 알려주세요</h3>
              <p>처음 / 해본 적 있음 / 다시 준비 중 중 하나를 고르면 설명 밀도를 맞춥니다.</p>
              <div className={`${styles.choiceGrid} ${styles.compactGrid}`} role="group" aria-label="치료 경험 선택">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <SelectionChip key={option.value} className={styles.choiceChip} onClick={() => setTreatmentExperience(option.value)} selected={treatmentExperience === option.value} tone="sage">
                    <span>{option.label}</span>
                    <small>{option.helper}</small>
                  </SelectionChip>
                ))}
              </div>
              <div className={styles.slideActions}>
                <CtaButton onClick={() => goToStep('brand_intro')} variant="secondary" type="button">이전</CtaButton>
                <CtaButton disabled={!treatmentExperience} onClick={continueAfterExperience} type="button">다음</CtaButton>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeStep === 'add_method' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="add-method-title">
          <StatusBadge state="shared">안내 추가</StatusBadge>
          <h2 className={styles.sectionTitle} id="add-method-title">어떻게 추가할까요?</h2>
          <p className={styles.questionLead}>아직 저장하지 않습니다. 다음 화면에서 사용자가 확인한 내용만 안전하게 이어갑니다.</p>
          <div className={styles.choiceGrid} role="group" aria-label="안내 추가 방식 선택">
            {ADD_METHODS.map((method) => (
              <SelectionChip key={method.step} className={styles.choiceChip} onClick={() => goToStep(method.step)} selected={false} tone={method.step === 'photo_processing' ? 'coral' : 'sage'}>
                <span>{method.label}</span>
                <small>{method.helper}</small>
              </SelectionChip>
            ))}
          </div>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={() => goToStep('sharing')} type="button">나중에 하기</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'photo_processing' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="photo-processing-title">
          <StatusBadge state={photoPhase === 'not_found' ? 'attention' : photoPhase === 'ready' ? 'done' : 'shared'}>사진 추가</StatusBadge>
          <h2 className={styles.sectionTitle} id="photo-processing-title">사진으로 안내를 남겨주세요</h2>
          <p className={styles.questionLead}>기본 iOS 사진 선택만 사용합니다. 분석 결과는 후보로만 보여드리고, 확인 전에는 일정으로 저장하지 않아요.</p>

          <input ref={cameraInputRef} className={styles.hiddenFileInput} type="file" accept="image/*" capture="environment" onChange={(event) => processPhotoFile(event.currentTarget.files?.[0])} />
          <input ref={galleryInputRef} className={styles.hiddenFileInput} type="file" accept="image/*" onChange={(event) => processPhotoFile(event.currentTarget.files?.[0])} />

          <div className={styles.photoPickerActions}>
            <CtaButton onClick={() => cameraInputRef.current?.click()} type="button">사진 찍기</CtaButton>
            <CtaButton onClick={() => galleryInputRef.current?.click()} variant="secondary" type="button">사진 선택</CtaButton>
          </div>

          <ol className={styles.processingSteps} aria-label="사진 처리 상태">
            <li data-active={photoPhase === 'uploaded' || photoPhase === 'analyzing' || photoPhase === 'ready'}>업로드 완료</li>
            <li data-active={photoPhase === 'analyzing' || photoPhase === 'ready'}>내용 분석 중</li>
            <li data-active={photoPhase === 'ready'}>일정 후보 준비</li>
          </ol>

          <Notice tone={photoPhase === 'not_found' ? 'coral' : 'sage'}>{photoMessage}</Notice>
          {photoPhase === 'not_found' ? <CtaButton onClick={() => setPhotoPhase('idle')} variant="secondary" type="button">다시 찍기</CtaButton> : null}
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={() => goToStep('direct_entry')} variant="ghost" type="button">직접 적기</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'text_paste' ? (
        <PlaceholderStep
          body="문자 붙여넣기 저장은 이번 이슈 범위 밖입니다. 입력칸을 만들지 않아 민감정보를 저장하지 않습니다."
          onBack={goBack}
          title="문자로 붙여넣기는 곧 이어집니다"
        />
      ) : null}

      {activeStep === 'candidate_review' ? (
        reviewCandidates.length ? (
          <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="candidate-review-title">
            <StatusBadge state="attention">확인 필요</StatusBadge>
            <h2 className={styles.sectionTitle} id="candidate-review-title">일정을 확인해 주세요</h2>
            <p className={styles.questionLead}>필요하면 바로 고치고, 확인한 일정만 저장합니다.</p>
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
            <div className={styles.slideActions}>
              <CtaButton onClick={() => goToStep('add_method')} variant="secondary" type="button">이전</CtaButton>
              <CtaButton disabled={savingCandidates || reviewCandidates.every((candidate) => candidate.decision === 'rejected')} onClick={confirmCandidates} type="button">{savingCandidates ? '저장 중' : '일정 확인하기'}</CtaButton>
            </div>
          </section>
        ) : (
          <PlaceholderStep body="확인할 후보가 아직 없습니다. 사진이나 문자를 다시 추가해 주세요." onBack={() => goToStep('add_method')} title="후보가 없어요" />
        )
      ) : null}

      {activeStep === 'direct_entry' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="direct-entry-title">
          <StatusBadge state="shared">직접 입력</StatusBadge>
          <h2 className={styles.sectionTitle} id="direct-entry-title">기억나는 일정만 적어주세요</h2>
          <p className={styles.questionLead}>확인한 내용만 저장합니다. 나중에 홈에서 다시 추가할 수도 있어요.</p>

          <div className={`${styles.choiceGrid} ${styles.compactGrid}`} role="group" aria-label="일정 종류 선택">
            {(['injection', 'medication', 'clinic'] as const).map((type) => (
              <SelectionChip key={type} className={styles.choiceChip} onClick={() => setDirectType(type)} selected={directType === type} tone={type === 'clinic' ? 'lavender' : 'sage'}>
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

          <div className={styles.slideActions}>
            <CtaButton onClick={() => goToStep('sharing')} variant="secondary" type="button">나중에 홈에서 추가</CtaButton>
            <CtaButton disabled={!directTitle.trim() || savingDirectEntry} onClick={rememberDirectEntry} type="button">{savingDirectEntry ? '저장 중' : '이 일정 기억하기'}</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'sharing' ? (
        <PlaceholderStep
          body={savedReviewItems.length ? `${savedReviewItems[0].title} 일정이 홈에 반영되도록 저장됐어요.` : '공유 설정은 이후 단계에서 사용자 확인 후 저장됩니다.'}
          onBack={() => goToStep('add_method')}
          title="공유 설정은 다음 단계에서 준비됩니다"
        />
      ) : null}

      {activeStep === 'complete' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide} ${styles.partnerExitStep}`} aria-labelledby="complete-title">
          <StatusBadge state="done">안내 완료</StatusBadge>
          <h2 className={styles.sectionTitle} id="complete-title">파트너는 초대 링크로 들어와 주세요</h2>
          <p className={styles.questionLead}>치료자가 Fevio에서 초대 링크를 보내면, 파트너 화면에서 오늘 도울 일만 확인할 수 있어요.</p>
          <Notice tone="sage">지금은 파트너 계정 없이 링크 안내만 보여드리고 온보딩을 종료합니다.</Notice>
          <CtaButton onClick={() => window.location.assign('/')} type="button">처음 화면으로 가기</CtaButton>
        </section>
      ) : null}

      {error ? <Notice tone="coral">{error}</Notice> : null}
    </div>
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
  if (!dose && !unit) return '용량 없음';
  return `${dose ?? ''}${dose && unit ? ' ' : ''}${unit ?? ''}`.trim();
}

function PlaceholderStep({ body, onBack, title }: { body: string; onBack: () => void; title: string }) {
  return (
    <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="placeholder-title">
      <StatusBadge state="idle">준비 중</StatusBadge>
      <h2 className={styles.sectionTitle} id="placeholder-title">{title}</h2>
      <p className={styles.questionLead}>{body}</p>
      <div className={styles.slideActions}>
        <CtaButton onClick={onBack} variant="secondary" type="button">이전</CtaButton>
        <CtaButton disabled type="button">확인 후 계속</CtaButton>
      </div>
    </section>
  );
}
