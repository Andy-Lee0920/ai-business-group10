'use client';

import { useMemo, useState } from 'react';
import { CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';
import styles from './onboarding.module.css';

type TreatmentContext = 'ivf_cycle' | 'transfer_wait' | 'early_check' | 'unsure';
type FirstItemKind = 'schedule' | 'medication' | 'injection';
type OnboardingStep = 'treatment' | 'first_item' | 'partner' | 'review';

type CompleteResponse = { redirectTo?: string; error?: string };

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: 'treatment', label: '상황' },
  { id: 'first_item', label: '첫 항목' },
  { id: 'partner', label: '공유' },
  { id: 'review', label: '확인' },
];

const TREATMENT_OPTIONS: Array<{ value: TreatmentContext; label: string; helper: string }> = [
  { value: 'ivf_cycle', label: '주사/채취 준비 중', helper: '오늘 할 일이나 주사 시간이 있을 수 있어요.' },
  { value: 'transfer_wait', label: '이식 후 기다리는 중', helper: '조용히 확인할 일정이나 약이 있을 수 있어요.' },
  { value: 'early_check', label: '검사/방문을 앞둠', helper: '방문 일정 확인부터 시작해요.' },
  { value: 'unsure', label: '첫 항목부터 시작', helper: '주사·방문·약 중 하나를 먼저 남겨요.' },
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
  const [activeStep, setActiveStep] = useState<OnboardingStep>('treatment');
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
  const canAdvanceFirstItem = !firstItemKind || Boolean(trimmedFirstItem);

  const summaryItems = useMemo(
    () => [
      { label: '지금 위치', value: labelFor(TREATMENT_OPTIONS, treatmentContext) },
      { label: '기록 방식', value: '내 화면부터 시작' },
      { label: '첫 케어 항목', value: firstItemKind && trimmedFirstItem ? `${labelFor(FIRST_ITEM_OPTIONS, firstItemKind)} · ${trimmedFirstItem}` : '홈만 먼저 만들기' },
      { label: '파트너 초대', value: partnerInviteSkipped ? '지금은 건너뛰기' : '공유 준비' },
    ],
    [firstItemKind, partnerInviteSkipped, treatmentContext, trimmedFirstItem],
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

  function continueFromFirstItem() {
    if (!canAdvanceFirstItem) {
      setError('첫 케어 항목은 종류와 내용을 함께 적어 주세요. 아직 없다면 종류 선택을 지워 주세요.');
      return;
    }
    goToStep('partner');
  }

  async function completeOnboarding() {
    if (!treatmentContext) {
      setError('지금 위치에 가까운 상황을 하나 골라 주세요.');
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

      {activeStep === 'treatment' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="treatment-context-title">
          <StatusBadge state="shared">처음 확인</StatusBadge>
          <h2 className={styles.sectionTitle} id="treatment-context-title">오늘은 어떤 흐름으로 시작할까요?</h2>
          <p className={styles.questionLead}>답한 장면에 맞춰 첫 홈의 분위기와 파트너 역할이 이어집니다.</p>
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
          <h2 className={styles.sectionTitle} id="first-item-title">오늘 케어에 올려둘 한 문장이 있나요?</h2>
          <p className={styles.questionLead}>시간, 약, 방문처럼 이미 확인한 말만 첫 흐름에 올려둘게요.</p>
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
          <small className="helper-row">약 이름이나 용량은 Fevio가 판단하지 않아요. 사용자가 적은 문장 그대로 확인 카드가 됩니다.</small>
          <div className={styles.slideActions}>
            <CtaButton onClick={goBack} variant="secondary" type="button">이전</CtaButton>
            <CtaButton onClick={continueFromFirstItem} type="button">다음 질문</CtaButton>
          </div>
        </section>
      ) : null}

      {activeStep === 'partner' ? (
        <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="partner-invite-title">
          <StatusBadge state="shared">파트너</StatusBadge>
          <h2 className={styles.sectionTitle} id="partner-invite-title">파트너와 역할을 나눌까요?</h2>
          <p className={styles.partnerCopy}>함께 보면 역할이 나뉘고, 오늘은 내 홈부터 시작해도 흐름은 이어집니다.</p>
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
          <h2 className={styles.sectionTitle} id="review-title">이 흐름으로 첫 홈을 열까요?</h2>
          <p className={styles.questionLead}>방금 답한 장면을 기준으로 오늘의 첫 화면을 열어요.</p>
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
