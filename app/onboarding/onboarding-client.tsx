'use client';

import { useState } from 'react';
import { CtaButton, Notice, SelectionChip } from '../../src/components/ui';

type TreatmentContext = 'ivf_cycle' | 'transfer_wait' | 'early_check' | 'unsure';
type RoleContext = 'primary_solo' | 'primary_with_partner' | 'shared_later';
type FirstItemKind = 'schedule' | 'medication' | 'injection';

type CompleteResponse = { redirectTo?: string; error?: string };

const TREATMENT_OPTIONS: Array<{ value: TreatmentContext; label: string; helper: string }> = [
  { value: 'ivf_cycle', label: '주사/채취 준비 중', helper: '오늘 할 일이나 주사 시간이 있을 수 있어요.' },
  { value: 'transfer_wait', label: '이식 후 기다리는 중', helper: '조용히 확인할 일정이나 약이 있을 수 있어요.' },
  { value: 'early_check', label: '검사/방문을 앞둠', helper: '방문 일정 확인부터 시작해요.' },
  { value: 'unsure', label: '아직 잘 모르겠어요', helper: '첫 항목만 안전하게 적어도 괜찮아요.' },
];

const ROLE_OPTIONS: Array<{ value: RoleContext; label: string }> = [
  { value: 'primary_solo', label: '내가 주로 기록해요' },
  { value: 'primary_with_partner', label: '같이 확인할 예정이에요' },
  { value: 'shared_later', label: '공유는 나중에 할게요' },
];

const FIRST_ITEM_OPTIONS: Array<{ value: FirstItemKind; label: string }> = [
  { value: 'schedule', label: '일정' },
  { value: 'medication', label: '약' },
  { value: 'injection', label: '주사' },
];

export function OnboardingClient() {
  const [treatmentContext, setTreatmentContext] = useState<TreatmentContext | null>(null);
  const [roleContext, setRoleContext] = useState<RoleContext | null>(null);
  const [firstItemKind, setFirstItemKind] = useState<FirstItemKind | null>(null);
  const [firstItemText, setFirstItemText] = useState('');
  const [partnerInviteSkipped, setPartnerInviteSkipped] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completeOnboarding() {
    if (!treatmentContext) {
      setError('지금 위치에 가까운 상황을 하나 골라 주세요.');
      return;
    }

    const trimmedFirstItem = firstItemText.trim();
    if ((firstItemKind && !trimmedFirstItem) || (!firstItemKind && trimmedFirstItem)) {
      setError('첫 실행 항목은 종류와 내용을 함께 입력해 주세요.');
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
    <div className="capture-form" aria-label="처음 설정">
      <section className="split-item" aria-labelledby="treatment-context-title">
        <h2 id="treatment-context-title">어디쯤에 있으세요?</h2>
        <div className="chip-grid" role="group" aria-label="치료 상황 선택">
          {TREATMENT_OPTIONS.map((option) => (
            <SelectionChip
              key={option.value}
              onClick={() => setTreatmentContext(option.value)}
              selected={treatmentContext === option.value}
              tone="sage"
            >
              <span>{option.label}</span>
              <small>{option.helper}</small>
            </SelectionChip>
          ))}
        </div>
      </section>

      <section className="split-item" aria-labelledby="role-context-title">
        <h2 id="role-context-title">기록 방식은 어떻게 시작할까요?</h2>
        <div className="chip-grid" role="group" aria-label="기록 방식 선택">
          {ROLE_OPTIONS.map((option) => (
            <SelectionChip
              key={option.value}
              onClick={() => setRoleContext(option.value)}
              selected={roleContext === option.value}
              tone="lavender"
            >
              {option.label}
            </SelectionChip>
          ))}
        </div>
      </section>

      <section className="split-item" aria-labelledby="first-item-title">
        <h2 id="first-item-title">첫 실행 항목 하나만 적어볼까요?</h2>
        <div className="chip-grid chip-grid--compact" role="group" aria-label="첫 항목 종류 선택">
          {FIRST_ITEM_OPTIONS.map((option) => (
            <SelectionChip
              key={option.value}
              onClick={() => setFirstItemKind(option.value)}
              selected={firstItemKind === option.value}
              tone={option.value === 'injection' ? 'coral' : 'sage'}
            >
              {option.label}
            </SelectionChip>
          ))}
        </div>
        <label className="field-label" htmlFor="first-onboarding-item">
          첫 실행 항목
        </label>
        <textarea
          id="first-onboarding-item"
          onChange={(event) => setFirstItemText(event.target.value)}
          placeholder="예: 오늘 밤 9시 주사 확인 또는 내일 오전 병원 방문"
          rows={3}
          value={firstItemText}
        />
        <small className="helper-row">약 이름이나 용량은 Fevio가 판단하지 않아요. 사용자가 적은 문장 그대로 확인 카드가 됩니다.</small>
      </section>

      <section className="split-item" aria-labelledby="partner-invite-title">
        <h2 id="partner-invite-title">파트너 초대</h2>
        <p className="lead">공유 링크는 나중에 만들어도 돼요. 지금은 홈을 먼저 만들 수 있어요.</p>
        <SelectionChip onClick={() => setPartnerInviteSkipped(true)} selected={partnerInviteSkipped} tone="lavender">
          지금은 건너뛰기
        </SelectionChip>
      </section>

      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={completeOnboarding} type="button">
        홈 만들기
      </CtaButton>
    </div>
  );
}
