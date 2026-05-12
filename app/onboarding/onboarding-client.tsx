'use client';

import { useMemo, useState } from 'react';
import { CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';
import styles from './onboarding.module.css';

type TreatmentContext = 'ivf_cycle' | 'transfer_wait' | 'early_check' | 'unsure';
type TreatmentExperience = 'first_ivf' | 'experienced_ivf' | 'returning_ivf';
type FirstItemKind = 'schedule' | 'medication' | 'injection';
type OnboardingStep = 'experience' | 'body_profile' | 'medical_notes' | 'treatment' | 'first_item' | 'partner' | 'review';

type CompleteResponse = { redirectTo?: string; error?: string };

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: 'experience', label: '경험' },
  { id: 'body_profile', label: '기본' },
  { id: 'medical_notes', label: '주의' },
  { id: 'treatment', label: '흐름' },
  { id: 'first_item', label: '첫 항목' },
  { id: 'partner', label: '공유' },
  { id: 'review', label: '확인' },
];

const EXPERIENCE_OPTIONS: Array<{ value: TreatmentExperience; label: string; helper: string }> = [
  { value: 'first_ivf', label: '처음이에요', helper: '낯선 말은 풀어서 보여드려요.' },
  { value: 'experienced_ivf', label: '해본 적 있어요', helper: '반복 설명은 줄일게요.' },
  { value: 'returning_ivf', label: '다시 준비 중', helper: '이전 기록과 오늘을 나눠 볼게요.' },
];

const TREATMENT_OPTIONS: Array<{ value: TreatmentContext; label: string; helper: string }> = [
  { value: 'ivf_cycle', label: '주사/채취 준비 중', helper: '시간 확인이 먼저예요.' },
  { value: 'transfer_wait', label: '이식 후 기다리는 중', helper: '조용히 볼 일정만 남겨요.' },
  { value: 'early_check', label: '검사/방문을 앞둠', helper: '방문 준비부터 정리해요.' },
  { value: 'unsure', label: '아직 모르겠어요', helper: '첫 항목부터 시작해요.' },
];

const FIRST_ITEM_OPTIONS: Array<{ value: FirstItemKind; label: string; helper: string }> = [
  { value: 'schedule', label: '일정', helper: '방문·검사·취소' },
  { value: 'medication', label: '약', helper: '복용·질정·패치' },
  { value: 'injection', label: '주사', helper: '시간·준비물 확인' },
];

function labelFor<T extends string>(options: Array<{ value: T; label: string }>, value: T | null) {
  return options.find((option) => option.value === value)?.label ?? '아직 선택 전';
}

export function OnboardingClient() {
  const [activeStep, setActiveStep] = useState<OnboardingStep>('experience');
  const [treatmentExperience, setTreatmentExperience] = useState<TreatmentExperience | null>(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [treatmentContext, setTreatmentContext] = useState<TreatmentContext | null>(null);
  const roleContext = 'primary_solo';
  const [firstItemKind, setFirstItemKind] = useState<FirstItemKind | null>(null);
  const [firstItemText, setFirstItemText] = useState('');
  const [partnerInviteSkipped, setPartnerInviteSkipped] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);
  const progress = Math.round(((activeIndex + 1) / STEPS.length) * 100);
  const trimmedFirstItem = firstItemText.trim();
  const trimmedMedicalNotes = medicalNotes.trim();
  const canAdvanceFirstItem = !firstItemKind || Boolean(trimmedFirstItem);
  const canAdvanceBodyProfile = Boolean(age.trim() && heightCm.trim() && weightKg.trim());

  const summaryItems = useMemo(
    () => [
      { label: '시술 경험', value: labelFor(EXPERIENCE_OPTIONS, treatmentExperience) },
      { label: '기본 정보', value: age && heightCm && weightKg ? `${age}세 · ${heightCm}cm · ${weightKg}kg` : '아직 입력 전' },
      { label: '주의사항', value: trimmedMedicalNotes || '없음' },
      { label: '지금 위치', value: labelFor(TREATMENT_OPTIONS, treatmentContext) },
      { label: '기록 방식', value: '내 화면부터 시작' },
      { label: '첫 케어 항목', value: firstItemKind && trimmedFirstItem ? `${labelFor(FIRST_ITEM_OPTIONS, firstItemKind)} · ${trimmedFirstItem}` : '홈만 먼저 만들기' },
      { label: '파트너 초대', value: partnerInviteSkipped ? '지금은 건너뛰기' : '공유 준비' },
    ],
    [age, firstItemKind, heightCm, medicalNotes, partnerInviteSkipped, treatmentContext, treatmentExperience, trimmedFirstItem, trimmedMedicalNotes, weightKg],
  );

  function goToStep(step: OnboardingStep) {
    setError(null);
    setActiveStep(step);
  }

  function goBack() {
    const previous = STEPS[Math.max(0, activeIndex - 1)]?.id;
    if (previous) goToStep(previous);
  }

  function selectTreatment(value: TreatmentContext) {
    setTreatmentContext(value);
    goToStep('first_item');
  }

  function selectExperience(value: TreatmentExperience) {
    setTreatmentExperience(value);
    goToStep('body_profile');
  }

  function continueFromBodyProfile() {
    if (!canAdvanceBodyProfile) {
      setError('나이, 신장, 체중을 짧게 입력해 주세요.');
      return;
    }
    goToStep('medical_notes');
  }

  function continueFromFirstItem() {
    if (!canAdvanceFirstItem) {
      setError('첫 케어 항목은 종류와 내용을 함께 적어 주세요. 아직 없다면 종류 선택을 지워 주세요.');
      return;
    }
    goToStep('partner');
  }

  async function completeOnboarding() {
    if (!treatmentExperience) {
      setError('시술 경험을 하나 골라 주세요.');
      goToStep('experience');
      return;
    }

    if (!canAdvanceBodyProfile) {
      setError('나이, 신장, 체중을 짧게 입력해 주세요.');
      goToStep('body_profile');
      return;
    }

    if (!treatmentContext) {
      setError('가까운 치료 흐름을 하나 골라 주세요.');
      goToStep('treatment');
      return;
    }

    if ((firstItemKind && !trimmedFirstItem) || (!firstItemKind && trimmedFirstItem)) {
      setError('첫 케어 항목은 종류와 내용을 함께 입력해 주세요.');
      goToStep('first_item');
      return;
    }

    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        treatmentExperience,
        baselineProfile: { age, heightCm, weightKg, medicalNotes: trimmedMedicalNotes },
        treatmentContext,
        roleContext,
        partnerInviteSkipped,
        firstItem: firstItemKind && trimmedFirstItem ? { kind: firstItemKind, text: trimmedFirstItem } : null,
      }),
    });
    const payload = (await response.json()) as CompleteResponse;

    if (!response.ok) {
      setError(payload.error ?? '처음 설정을 저장하지 못했어요.');
      setSubmitting(false);
      return;
    }

    window.location.href = payload.redirectTo ?? '/home';
  }

  return (
    <div className={styles.onboardingFlow} aria-label="처음 설정 인터뷰">
      <div className={styles.interviewProgress} aria-label={`처음 설정 ${activeIndex + 1}/${STEPS.length}`}>
        <span>{activeIndex + 1}/{STEPS.length}</span>
        <div className={styles.progressTrack} aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>
        <small>{STEPS[activeIndex]?.label}</small>
      </div>

      {activeStep === 'experience' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="experience-title">
          <StatusBadge state="shared">시술 경험</StatusBadge>
          <h2 className={styles.sectionTitle} id="experience-title">시술은 처음인가요?</h2>
          <p className={styles.questionLead}>처음이면 더 천천히 보여드려요.</p>
          <div className={styles.choiceGrid} role="group" aria-label="시술 경험 선택">
            {EXPERIENCE_OPTIONS.map((option) => (
              <SelectionChip
                key={option.value}
                onClick={() => selectExperience(option.value)}
                selected={treatmentExperience === option.value}
                className={styles.choiceChip}
                tone="sage"
              >
                <span>{option.label}</span>
                <small>{option.helper}</small>
              </SelectionChip>
            ))}
          </div>
        </section>
      ) : null}

      {activeStep === 'body_profile' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="body-profile-title">
          <StatusBadge state="shared">기본 정보</StatusBadge>
          <h2 className={styles.sectionTitle} id="body-profile-title">나이·키·몸무게</h2>
          <p className={styles.questionLead}>병원에 이미 알려둔 정보만 적어요.</p>
          <div className={styles.profileGrid}>
            <label className={styles.inlineField} htmlFor="onboarding-age">
              <span>나이</span>
              <input id="onboarding-age" inputMode="numeric" min="1" onChange={(event) => setAge(event.target.value)} pattern="[0-9]*" type="number" value={age} />
            </label>
            <label className={styles.inlineField} htmlFor="onboarding-height">
              <span>신장</span>
              <input id="onboarding-height" inputMode="decimal" min="1" onChange={(event) => setHeightCm(event.target.value)} type="number" value={heightCm} />
            </label>
            <label className={styles.inlineField} htmlFor="onboarding-weight">
              <span>체중</span>
              <input id="onboarding-weight" inputMode="decimal" min="1" onChange={(event) => setWeightKg(event.target.value)} type="number" value={weightKg} />
            </label>
          </div>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={continueFromBodyProfile} type="button">다음</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'medical_notes' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="medical-notes-title">
          <StatusBadge state="shared">주의사항</StatusBadge>
          <h2 className={styles.sectionTitle} id="medical-notes-title">주의할 몸 상태</h2>
          <p className={styles.questionLead}>병원에 말해둔 내용만 선택적으로 남겨요.</p>
          <label className="field-label" htmlFor="onboarding-medical-notes">
            병력 또는 주의사항
          </label>
          <textarea
            className={styles.textArea}
            id="onboarding-medical-notes"
            onChange={(event) => setMedicalNotes(event.target.value)}
            placeholder="예: 갑상선 약 복용, 빈혈, 알레르기"
            rows={3}
            value={medicalNotes}
          />
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={() => goToStep('treatment')} type="button">다음</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'treatment' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="treatment-context-title">
          <StatusBadge state="shared">치료 흐름</StatusBadge>
          <h2 className={styles.sectionTitle} id="treatment-context-title">지금 가까운 흐름</h2>
          <p className={styles.questionLead}>하나만 고르면 됩니다.</p>
          <div className={styles.choiceGrid} role="group" aria-label="치료 상황 선택">
            {TREATMENT_OPTIONS.map((option) => (
              <SelectionChip
                key={option.value}
                onClick={() => selectTreatment(option.value)}
                selected={treatmentContext === option.value}
                className={styles.choiceChip}
                tone="sage"
              >
                <span>{option.label}</span>
                <small>{option.helper}</small>
              </SelectionChip>
            ))}
          </div>
        </section>
      ) : null}

      {activeStep === 'first_item' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="first-item-title">
          <StatusBadge state="shared">첫 케어</StatusBadge>
          <h2 className={styles.sectionTitle} id="first-item-title">오늘 올릴 한 문장</h2>
          <p className={styles.questionLead}>확인한 일정·약·주사만 적어요.</p>
          <div className={`${styles.choiceGrid} ${styles.compactGrid}`} role="group" aria-label="첫 항목 종류 선택">
            {FIRST_ITEM_OPTIONS.map((option) => (
              <SelectionChip
                key={option.value}
                onClick={() => setFirstItemKind(firstItemKind === option.value ? null : option.value)}
                selected={firstItemKind === option.value}
                className={styles.choiceChip}
                tone={option.value === 'injection' ? 'coral' : 'sage'}
              >
                <span>{option.label}</span>
                <small>{option.helper}</small>
              </SelectionChip>
            ))}
          </div>
          <label className="field-label" htmlFor="first-onboarding-item">
            첫 케어 항목
          </label>
          <textarea
            className={styles.textArea}
            id="first-onboarding-item"
            onChange={(event) => setFirstItemText(event.target.value)}
            placeholder="예: 오늘 밤 9시 주사 확인 또는 내일 오전 병원 방문"
            rows={3}
            value={firstItemText}
          />
          <small className="helper-row">적은 문장 그대로 확인 카드가 됩니다.</small>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={continueFromFirstItem} type="button">다음 질문</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'partner' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="partner-invite-title">
          <StatusBadge state="shared">파트너</StatusBadge>
          <h2 className={styles.sectionTitle} id="partner-invite-title">파트너 공유</h2>
          <p className={styles.partnerCopy}>지금은 건너뛸 수 있어요.</p>
          <div className={styles.choiceGrid} role="group" aria-label="파트너 초대 선택">
            <SelectionChip className={styles.choiceChip} onClick={() => setPartnerInviteSkipped(true)} selected={partnerInviteSkipped} tone="lavender">
              <span>지금은 건너뛰기</span>
              <small>내 홈부터 만들고 나중에 초대해요.</small>
            </SelectionChip>
            <SelectionChip className={styles.choiceChip} onClick={() => setPartnerInviteSkipped(false)} selected={!partnerInviteSkipped} tone="sage">
              <span>공유 준비해둘게요</span>
              <small>파트너에게 보일 카드 기준을 확인해요.</small>
            </SelectionChip>
          </div>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={() => goToStep('review')} type="button">마지막 확인</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'review' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="review-title">
          <StatusBadge state="synced">마지막 확인</StatusBadge>
          <h2 className={styles.sectionTitle} id="review-title">첫 홈 열기</h2>
          <p className={styles.questionLead}>답한 내용으로 시작합니다.</p>
          <dl className={styles.reviewList}>
            {summaryItems.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton disabled={submitting} onClick={completeOnboarding} type="button">홈 만들기</CtaButton>
          </div>
        </section>
      ) : null}

      {error ? <Notice tone="coral">{error}</Notice> : null}
    </div>
  );
}
