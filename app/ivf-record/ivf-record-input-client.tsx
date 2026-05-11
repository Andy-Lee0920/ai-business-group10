'use client';

import { useState } from 'react';
import { Card, ConfirmChip, CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';

type IvfStage = 'cos' | 'trigger' | 'opu' | 'culture' | 'transfer' | 'tww' | 'result';
type CreatedRecord = {
  cardId: string;
  title: string;
  description: string;
  stage: IvfStage;
  date: string;
  partnerVisible: boolean;
};
type ApiPayload = {
  cardId?: string;
  title?: string;
  description?: string;
  partnerVisible?: boolean;
  error?: string;
};

const STAGE_OPTIONS: Array<{ value: IvfStage; label: string }> = [
  { value: 'cos', label: '과배란 유도' },
  { value: 'trigger', label: '최종 성숙 주사' },
  { value: 'opu', label: '난자 채취' },
  { value: 'culture', label: '배아 배양' },
  { value: 'transfer', label: '이식' },
  { value: 'tww', label: '이식 후 대기' },
  { value: 'result', label: '결과 확인' },
];

export function IvfRecordInputClient() {
  const [stage, setStage] = useState<IvfStage>('cos');
  const [date, setDate] = useState('');
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CreatedRecord | null>(null);

  async function createRecord() {
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/ivf-record', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stage, date, outcome, note, shareWithPartner }),
    });
    const payload = (await response.json().catch(() => ({}))) as ApiPayload;

    if (!response.ok || !payload.cardId || !payload.title || !payload.description) {
      setError(payload.error ?? '지금은 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      setSubmitting(false);
      return;
    }

    setCard({
      cardId: payload.cardId,
      title: payload.title,
      description: payload.description,
      stage,
      date,
      partnerVisible: payload.partnerVisible === true,
    });
    setSubmitting(false);
  }

  return (
    <div className="capture-form">
      <fieldset className="schedule-fieldset">
        <legend>어떤 단계였나요?</legend>
        <div className="schedule-chip-row" role="group" aria-label="시술 단계 선택">
          {STAGE_OPTIONS.map((option) => (
            <SelectionChip key={option.value} selected={stage === option.value} onClick={() => setStage(option.value)} tone={option.value === 'trigger' ? 'coral' : 'sage'}>
              {option.label}
            </SelectionChip>
          ))}
        </div>
      </fieldset>

      <label className="field-label" htmlFor="ivf-record-date">날짜</label>
      <input id="ivf-record-date" value={date} onChange={(event) => setDate(event.target.value)} type="date" />

      <label className="field-label" htmlFor="ivf-record-outcome">확인한 기록</label>
      <input id="ivf-record-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="예: 배아 리포트 확인" />
      <small>숫자나 결과를 적어도 Fevio가 해석하지 않아요.</small>

      <label className="field-label" htmlFor="ivf-record-note">나만 보는 메모</label>
      <textarea id="ivf-record-note" maxLength={120} value={note} onChange={(event) => setNote(event.target.value)} placeholder="예: 등급 때문에 마음이 흔들림" />

      <ConfirmChip selected={shareWithPartner} onClick={() => setShareWithPartner((value) => !value)} tone="lavender">
        파트너에게 안전한 단계 요약만 공유할래요
      </ConfirmChip>

      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={createRecord} type="button">
        IVF 기록 저장
      </CtaButton>

      {card ? (
        <Card as="article" data-testid="ivf-record-card" tone={card.partnerVisible ? 'lavender' : 'sage'}>
          <StatusBadge state={card.partnerVisible ? 'shared' : 'idle'}>{card.partnerVisible ? '공유됨' : '비공개'}</StatusBadge>
          <h2>{card.title}</h2>
          <p className="lead">{card.description}</p>
          <small>{card.date} · 원문 결과와 메모는 파트너 화면에 보내지 않아요.</small>
        </Card>
      ) : null}
    </div>
  );
}
