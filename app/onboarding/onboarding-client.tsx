'use client';

import { useMemo, useState } from 'react';
import { CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';
import {
  buildUtilityPreview,
  defaultSharingLevelByStage,
  formatStageLabel,
  getEffectiveStage,
  inferStageFromCareItem,
  IVF_STAGE_LABELS,
  type IvfStage,
  type SelectedIntent,
  type SharingLevel,
} from '../../src/domain/onboarding-care-state';
import styles from './onboarding.module.css';

type TreatmentExperience = 'first_ivf' | 'experienced_ivf' | 'returning_ivf';
type RoleContext = 'primary_solo' | 'primary_with_partner';
type OnboardingStep = 'experience' | 'care_item' | 'sharing' | 'review';
type CompleteResponse = { redirectTo?: string; error?: string };
type Attachment = { id: string; type: 'photo'; source: 'camera' | 'upload'; localUrl?: string; status: 'local_only' | 'uploaded' | 'failed'; name?: string };

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: 'experience', label: '경험' },
  { id: 'care_item', label: '항목' },
  { id: 'sharing', label: '공유' },
  { id: 'review', label: '확인' },
];

const EXPERIENCE_OPTIONS: Array<{ value: TreatmentExperience; label: string; helper: string }> = [
  { value: 'first_ivf', label: '처음이에요', helper: '낯선 안내는 더 짧게 풀어 보여줍니다.' },
  { value: 'experienced_ivf', label: '해본 적 있어요', helper: '반복 설명보다 확인할 항목을 먼저 보여줍니다.' },
  { value: 'returning_ivf', label: '다시 준비 중', helper: '이전 기억과 이번 안내를 구분해 시작합니다.' },
];

const INTENT_OPTIONS: Array<{ value: SelectedIntent; label: string; helper: string }> = [
  { value: 'medication', label: '약·주사 안내', helper: '시간, 약, 주사 준비' },
  { value: 'clinic_visit', label: '병원 방문', helper: '방문, 검사, 예약' },
  { value: 'procedure', label: '채취·시술 준비', helper: '채취, 시술 전 안내' },
  { value: 'result_waiting', label: '결과 대기', helper: '수정·배아 결과 연락' },
  { value: 'post_transfer', label: '이식 후 관리', helper: '이식 후 약과 일정' },
  { value: 'pregnancy_test', label: '피검·임신 확인', helper: '피검, hCG, 결과일' },
  { value: 'unknown', label: '잘 모르겠어요', helper: '먼저 안내받은 내용만 남김' },
];

const STAGE_CORRECTION_OPTIONS: Array<{ value: IvfStage; label: string }> = [
  { value: 'baseline_testing', label: '검사' },
  { value: 'ovarian_stimulation', label: '주사' },
  { value: 'egg_retrieval', label: '채취' },
  { value: 'fertilization', label: '수정 결과' },
  { value: 'embryo_culture', label: '배아 결과' },
  { value: 'embryo_transfer', label: '이식 후' },
  { value: 'pregnancy_test', label: '피검' },
];

function explanationDensityFor(value: TreatmentExperience | null) {
  if (value === 'first_ivf') return 'guided';
  if (value === 'experienced_ivf') return 'compact';
  return 'standard';
}

export function OnboardingClient() {
  const [activeStep, setActiveStep] = useState<OnboardingStep>('experience');
  const [treatmentExperience, setTreatmentExperience] = useState<TreatmentExperience | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<SelectedIntent | null>(null);
  const [rawText, setRawText] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [showPhotoFlow, setShowPhotoFlow] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [roleContext, setRoleContext] = useState<RoleContext>('primary_solo');
  const [userCorrectedStage, setUserCorrectedStage] = useState<IvfStage | null>(null);
  const [stageSelectorOpen, setStageSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);
  const progress = Math.round(((activeIndex + 1) / STEPS.length) * 100);
  const trimmedRawText = rawText.trim();
  const trimmedMedicalNotes = medicalNotes.trim();
  const effectiveIntent = selectedIntent ?? 'unknown';
  const baseInference = useMemo(() => inferStageFromCareItem({ selectedIntent: effectiveIntent, rawText: trimmedRawText }), [effectiveIntent, trimmedRawText]);
  const inference = { ...baseInference, userCorrectedStage: userCorrectedStage ?? undefined };
  const effectiveStage = getEffectiveStage(inference);
  const sharingLevel: SharingLevel = roleContext === 'primary_with_partner' ? defaultSharingLevelByStage(effectiveStage) : 'basic';
  const preview = buildUtilityPreview(effectiveStage, trimmedRawText);
  const canAdvanceCareItem = Boolean(selectedIntent || trimmedRawText || attachments.length > 0);
  const progressLabel = `처음 설정 ${activeIndex + 1}/${STEPS.length}`;

  function goToStep(step: OnboardingStep) {
    setError(null);
    setActiveStep(step);
  }

  function goBack() {
    const previous = STEPS[Math.max(0, activeIndex - 1)]?.id;
    if (previous) goToStep(previous);
  }

  function selectExperience(value: TreatmentExperience) {
    setTreatmentExperience(value);
    goToStep('care_item');
  }

  function continueFromCareItem() {
    if (!canAdvanceCareItem) {
      setError('안내받은 약, 방문, 결과 일정 중 하나를 남겨주세요.');
      return;
    }
    goToStep('sharing');
  }

  function continueFromSharing(nextRoleContext = roleContext) {
    setRoleContext(nextRoleContext);
    goToStep('review');
  }

  function onPhotoChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setAttachments((current) => [
      ...current,
      { id: `local-${Date.now()}`, type: 'photo', source: 'camera', localUrl: `local-file:${file.name}`, status: 'local_only', name: file.name },
    ]);
  }

  async function completeOnboarding() {
    if (!treatmentExperience) {
      setError('시술 경험을 하나 선택해 주세요.');
      goToStep('experience');
      return;
    }
    if (!canAdvanceCareItem) {
      setError('안내받은 약, 방문, 결과 일정 중 하나를 남겨주세요.');
      goToStep('care_item');
      return;
    }

    setSubmitting(true);
    setIsGenerating(true);
    setError(null);

    const generationDelay = new Promise((resolve) => window.setTimeout(resolve, 2600));
    const request = fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        treatmentExperience,
        explanationDensity: explanationDensityFor(treatmentExperience),
        firstCareItem: {
          selectedIntent: effectiveIntent,
          rawText: trimmedRawText,
          attachments,
          medicalNotes: trimmedMedicalNotes,
        },
        inferredStage: inference.inferredStage,
        effectiveStage,
        roleContext,
        sharingLevel,
        partnerInvite: { intent: roleContext === 'primary_with_partner' ? 'prepare_invite' : 'skip' },
      }),
    });

    const [response] = await Promise.all([request, generationDelay]) as [Response, unknown];
    const payload = (await response.json()) as CompleteResponse;

    if (!response.ok) {
      setError(payload.error ?? '처음 화면을 만들지 못했어요.');
      setSubmitting(false);
      setIsGenerating(false);
      return;
    }

    window.location.href = payload.redirectTo ?? '/home';
  }

  if (isGenerating) {
    const steps = roleContext === 'primary_with_partner'
      ? ['치료 흐름 확인', '내 화면 카드 생성', '파트너 화면 준비', '공유 범위 적용']
      : ['치료 흐름 확인', '내 화면 카드 생성', '공유 설정 저장'];

    return (
      <section className={`${styles.choiceSection} ${styles.generatedTransition}`} aria-label="첫 화면 생성 중">
        <StatusBadge state="synced">화면 준비</StatusBadge>
        <h2 className={styles.sectionTitle}>첫 화면을 만들고 있어요</h2>
        <p className={styles.questionLead}>병원 안내를 기준으로 오늘의 케어 카드를 준비합니다.</p>
        <ol className={styles.generationList}>
          {steps.map((step, index) => <li key={step} style={{ '--delay-index': index } as React.CSSProperties}>✓ {step}</li>)}
        </ol>
      </section>
    );
  }

  return (
    <div className={styles.onboardingFlow} aria-label="처음 설정 인터뷰">
      <div className={styles.interviewProgress} aria-label={progressLabel}>
        <span>{activeIndex + 1}/{STEPS.length}</span>
        <div className={styles.progressTrack} aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
        <small>{STEPS[activeIndex]?.label}</small>
      </div>

      {activeStep === 'experience' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="experience-title">
          <StatusBadge state="shared">시술 경험</StatusBadge>
          <h2 className={styles.sectionTitle} id="experience-title">시술 경험이 어느 정도인지 확인할게요</h2>
          <p className={styles.questionLead}>병원 안내를 보여주는 설명의 양을 맞춥니다.</p>
          <div className={styles.choiceGrid} role="group" aria-label="시술 경험 선택">
            {EXPERIENCE_OPTIONS.map((option) => (
              <SelectionChip key={option.value} onClick={() => selectExperience(option.value)} selected={treatmentExperience === option.value} className={styles.choiceChip} tone="sage">
                <span>{option.label}</span><small>{option.helper}</small>
              </SelectionChip>
            ))}
          </div>
        </section>
      ) : null}

      {activeStep === 'care_item' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="care-item-title">
          <StatusBadge state="shared">현재 안내</StatusBadge>
          <h2 className={styles.sectionTitle} id="care-item-title">현재 치료 상황을 확인할게요</h2>
          <p className={styles.questionLead}>병원에서 안내받은 약, 방문, 결과 일정을 기준으로 시작합니다.</p>
          <div className={`${styles.choiceGrid} ${styles.intentGrid}`} role="group" aria-label="현재 치료 상황 선택">
            {INTENT_OPTIONS.map((option) => (
              <SelectionChip key={option.value} onClick={() => setSelectedIntent(option.value)} selected={selectedIntent === option.value} className={styles.choiceChip} tone={option.value === 'medication' ? 'coral' : 'sage'}>
                <span>{option.label}</span><small>{option.helper}</small>
              </SelectionChip>
            ))}
          </div>
          <label className="field-label" htmlFor="first-care-item">직접 입력</label>
          <textarea className={styles.textArea} id="first-care-item" onChange={(event) => setRawText(event.target.value)} placeholder="예: 밤에 주사, 오전 방문, 결과는 전화로 안내" rows={3} value={rawText} />
          <label className="field-label" htmlFor="care-notes">주의사항 선택 입력</label>
          <textarea className={`${styles.textArea} ${styles.compactTextArea}`} id="care-notes" onChange={(event) => setMedicalNotes(event.target.value)} placeholder="예: 알레르기, 병원에 말해둔 주의사항" rows={2} value={medicalNotes} />
          <div className={styles.photoInlineFlow}>
            <button className={styles.photoAddButton} type="button" onClick={() => setShowPhotoFlow(true)}>사진으로 추가</button>
            <span>약 봉투, 처방전, 병원 메모</span>
            {showPhotoFlow ? <input id="onboarding-photo" type="file" accept="image/*" capture="environment" onChange={(event) => onPhotoChange(event.target.files)} /> : null}
            {attachments.length > 0 ? <small>{attachments.length}개 사진을 추가했습니다. 사진은 사용자가 확인한 첨부로만 남깁니다.</small> : null}
          </div>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton disabled={!canAdvanceCareItem} onClick={continueFromCareItem} type="button">다음</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'sharing' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="sharing-title">
          <StatusBadge state="shared">공유 방식</StatusBadge>
          <h2 className={styles.sectionTitle} id="sharing-title">이 내용을 함께 볼 사람을 정할게요</h2>
          <p className={styles.questionLead}>공유 범위는 나중에 언제든 바꿀 수 있습니다.</p>
          <div className={styles.choiceGrid} role="group" aria-label="파트너 공유 방식 선택">
            <SelectionChip className={styles.choiceChip} onClick={() => setRoleContext('primary_solo')} selected={roleContext === 'primary_solo'} tone="sage">
              <span>나 혼자 시작할게요</span><small>내 화면에 먼저 정리하고, 필요하면 나중에 초대합니다.</small>
            </SelectionChip>
            <SelectionChip className={styles.choiceChip} onClick={() => setRoleContext('primary_with_partner')} selected={roleContext === 'primary_with_partner'} tone="lavender">
              <span>파트너와 함께 쓸게요</span><small>같은 항목을 역할에 맞게 나눠 보고, 초대 링크를 준비합니다.</small>
            </SelectionChip>
          </div>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={() => continueFromSharing()} type="button">다음</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'review' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="review-title">
          <StatusBadge state="synced">확인</StatusBadge>
          <h2 className={styles.sectionTitle} id="review-title">첫 화면을 이렇게 만들게요</h2>
          <div className={styles.generatedPreview} data-testid="generated-home-preview">
            <div className={styles.stagePreviewHeader}>
              <strong data-testid="inferred-stage-label">{formatStageLabel(effectiveStage)}</strong>
              <button type="button" onClick={() => setStageSelectorOpen((value) => !value)}>{inference.confidence === 'low' ? '단계 선택' : '단계 수정'}</button>
            </div>
            {inference.confidence === 'medium' ? <p className={styles.stageConfidence}>이 단계가 맞는지 확인해주세요.</p> : null}
            {inference.confidence === 'low' ? <p className={styles.stageConfidence}>먼저 병원 안내를 정리하는 화면으로 시작합니다.</p> : null}
            {stageSelectorOpen ? (
              <div className={styles.stageSelector} role="group" aria-label="단계 수정 선택">
                {STAGE_CORRECTION_OPTIONS.map((option) => (
                  <button key={option.value} type="button" aria-pressed={effectiveStage === option.value} onClick={() => { setUserCorrectedStage(option.value); setStageSelectorOpen(false); }}>
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            <section aria-label="내 화면 미리보기" className={styles.previewColumn}>
              <h3>내 화면</h3>
              {preview.patientCards.map((card) => <p key={card}>{card}</p>)}
            </section>
            {roleContext === 'primary_with_partner' ? (
              <section aria-label="파트너 화면 미리보기" className={styles.previewColumn}>
                <h3>파트너 화면</h3>
                {preview.partnerCards.map((card) => <p key={card}>{card}</p>)}
              </section>
            ) : null}
            <p className={styles.sharingLine}>공유 범위: {sharingLevel === 'care' ? '케어 항목' : '기본 안내'}</p>
          </div>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton disabled={submitting} onClick={completeOnboarding} type="button">첫 화면 만들기</CtaButton>
          </div>
        </section>
      ) : null}

      {error ? <Notice tone="coral">{error}</Notice> : null}
    </div>
  );
}
