'use client';

import { useState } from 'react';
import { Card, ConfirmChip, CtaButton, Notice, SelectionChip, StatusBadge, TimeInput } from '../../src/components/ui';

type MedicationType = 'medication' | 'injection' | 'general_action';
type RepeatPattern = 'once' | 'daily' | 'clinic_instruction';
type CreatedCard = {
  cardId: string;
  title: string;
  name: string;
  dose: string;
  time: string;
  repeat: RepeatPattern;
  status: 'confirmed' | 'completed';
};
type ApiPayload = { cardId?: string; title?: string; status?: 'confirmed' | 'completed'; error?: string };

const REPEAT_OPTIONS: Array<{ value: RepeatPattern; label: string }> = [
  { value: 'once', label: '오늘만' },
  { value: 'daily', label: '매일' },
  { value: 'clinic_instruction', label: '병원 안내대로' },
];

const TYPE_OPTIONS: Array<{ value: MedicationType; label: string }> = [
  { value: 'medication', label: '약' },
  { value: 'injection', label: '주사' },
  { value: 'general_action', label: '기타' },
];

export function MedicationInputClient() {
  const [type, setType] = useState<MedicationType>('medication');
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatPattern>('once');
  const [doseConfirmed, setDoseConfirmed] = useState(false);
  const [important, setImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CreatedCard | null>(null);

  async function createCard() {
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/medication', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, name, dose, doseConfirmed, time, repeat, important }),
    });
    const payload = (await response.json()) as ApiPayload;

    if (!response.ok || !payload.cardId) {
      setError(payload.error ?? '카드를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setSubmitting(false);
      return;
    }

    setCard({
      cardId: payload.cardId,
      title: payload.title ?? [name.trim(), dose.trim(), time].filter(Boolean).join(' · '),
      name: name.trim(),
      dose: dose.trim(),
      time,
      repeat,
      status: payload.status ?? 'confirmed',
    });
    setSubmitting(false);
  }

  async function completeCard() {
    if (!card) return;
    setError(null);
    const response = await fetch('/api/medication/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardId: card.cardId }),
    });
    const payload = (await response.json()) as ApiPayload;
    if (!response.ok) {
      setError(payload.error ?? '완료 표시를 저장하지 못했습니다.');
      return;
    }
    setCard({ ...card, status: 'completed' });
  }

  return (
    <div className="capture-form">
      <div role="group" aria-label="종류 선택" className="helper-row">
        {TYPE_OPTIONS.map((option) => (
          <SelectionChip key={option.value} selected={type === option.value} onClick={() => setType(option.value)} tone={option.value === 'injection' ? 'lavender' : 'sage'}>
            {option.label}
          </SelectionChip>
        ))}
      </div>

      <label className="field-label" htmlFor="medication-name">이름</label>
      <input id="medication-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 오비드렐" />

      <label className="field-label" htmlFor="medication-dose">용량</label>
      <input
        id="medication-dose"
        value={dose}
        onChange={(event) => {
          setDose(event.target.value);
          setDoseConfirmed(false);
        }}
        placeholder="예: 250mcg, 1정"
      />
      <ConfirmChip selected={doseConfirmed} onClick={() => setDoseConfirmed((value) => !value)} tone="lavender">
        용량을 내가 확인했어요
      </ConfirmChip>

      <TimeInput id="medication-time" label="시간" value={time} onChange={(event) => setTime(event.target.value)} helperText="알고 있는 시간만 적어 주세요." />

      <div role="group" aria-label="반복 선택" className="helper-row">
        {REPEAT_OPTIONS.map((option) => (
          <SelectionChip key={option.value} selected={repeat === option.value} onClick={() => setRepeat(option.value)} tone="sage">
            {option.label}
          </SelectionChip>
        ))}
      </div>

      <ConfirmChip selected={important} onClick={() => setImportant((value) => !value)} tone="coral">
        꼭 챙겨야 해요
      </ConfirmChip>

      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={createCard} type="button">
        카드 만들기
      </CtaButton>

      {card ? (
        <Card as="article" data-testid="medication-card" tone={card.status === 'completed' ? 'lavender' : 'sage'}>
          <StatusBadge state={card.status === 'completed' ? 'done' : 'shared'}>{card.status === 'completed' ? '완료' : '확정'}</StatusBadge>
          <h2>{card.name}</h2>
          <p className="lead">{card.dose} · {card.time} · {repeatLabel(card.repeat)}</p>
          {card.status === 'completed' ? null : (
            <CtaButton onClick={completeCard} type="button" variant="secondary">
              완료로 표시
            </CtaButton>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function repeatLabel(value: RepeatPattern) {
  if (value === 'daily') return '매일';
  if (value === 'clinic_instruction') return '병원 안내대로';
  return '오늘만';
}
