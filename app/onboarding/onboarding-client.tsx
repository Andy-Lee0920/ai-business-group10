'use client';

import { useMemo, useState } from 'react';
import { CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';
import styles from './onboarding.module.css';

export type OnboardingStep = 'brand_intro' | 'role_select' | 'add_method' | 'photo_processing' | 'text_paste' | 'candidate_review' | 'direct_entry' | 'sharing' | 'complete';

type TreatmentRole = 'patient' | 'partner';
type TreatmentExperience = 'first' | 'experienced' | 'returning';
type AddMethodStep = Extract<OnboardingStep, 'photo_processing' | 'text_paste' | 'direct_entry'>;
type DirectEntryType = 'injection' | 'medication' | 'clinic';
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
        <PlaceholderStep
          body="사진 처리와 OCR 저장은 이번 이슈 범위 밖입니다. 아직 사진이나 민감정보를 저장하지 않습니다."
          onBack={goBack}
          title="사진으로 남기기는 곧 이어집니다"
        />
      ) : null}

      {activeStep === 'text_paste' ? (
        <PlaceholderStep
          body="문자 붙여넣기 저장은 이번 이슈 범위 밖입니다. 입력칸을 만들지 않아 민감정보를 저장하지 않습니다."
          onBack={goBack}
          title="문자로 붙여넣기는 곧 이어집니다"
        />
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
          body="공유 설정은 이후 단계에서 사용자 확인 후 저장됩니다."
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
