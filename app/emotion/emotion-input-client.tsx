'use client';

import { useState } from 'react';
import { Card, ConfirmChip, CtaButton, Notice, SelectionChip, StatusBadge } from '../../src/components/ui';

type EmotionMood = 'overwhelmed' | 'lonely' | 'anxious' | 'tired' | 'okay';
type CreatedEmotion = {
  cardId: string;
  title: string;
  description: string;
  mood: EmotionMood;
  intensity: number;
  partnerVisible: boolean;
};
type ApiPayload = {
  cardId?: string;
  title?: string;
  description?: string;
  partnerVisible?: boolean;
  error?: string;
};

const MOOD_OPTIONS: Array<{ value: EmotionMood; label: string; helper: string }> = [
  { value: 'overwhelmed', label: '버거워요', helper: '할 일이 나에게 몰린 느낌' },
  { value: 'lonely', label: '혼자인 것 같아요', helper: '같이 하는 느낌이 약한 날' },
  { value: 'anxious', label: '불안해요', helper: '결과나 실수가 계속 떠오르는 날' },
  { value: 'tired', label: '지쳤어요', helper: '몸과 마음의 에너지가 낮은 날' },
  { value: 'okay', label: '괜찮아요', helper: '기록만 남겨두고 싶은 날' },
];

export function EmotionInputClient() {
  const [mood, setMood] = useState<EmotionMood | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CreatedEmotion | null>(null);

  async function createCard() {
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/emotion', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mood, intensity, note, shareWithPartner }),
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
      mood: mood ?? 'okay',
      intensity,
      partnerVisible: payload.partnerVisible === true,
    });
    setSubmitting(false);
  }

  return (
    <div className="capture-form">
      <fieldset className="schedule-fieldset">
        <legend>지금 어디에 가까워요?</legend>
        <div className="schedule-chip-row" role="group" aria-label="감정 선택">
          {MOOD_OPTIONS.map((option) => (
            <SelectionChip key={option.value} selected={mood === option.value} onClick={() => setMood(option.value)} tone={option.value === 'okay' ? 'sage' : 'lavender'}>
              {option.label}
            </SelectionChip>
          ))}
        </div>
        <small>{MOOD_OPTIONS.find((option) => option.value === mood)?.helper ?? '정확하지 않아도 괜찮아요. 가까운 하나만 고르면 됩니다.'}</small>
      </fieldset>

      <label className="field-label" htmlFor="emotion-intensity">부담 정도</label>
      <input
        id="emotion-intensity"
        min="1"
        max="5"
        type="range"
        value={intensity}
        onChange={(event) => setIntensity(Number(event.target.value))}
      />
      <p className="lead">{intensity}/5 정도로 기록할게요.</p>

      <label className="field-label" htmlFor="emotion-note">나만 보는 메모</label>
      <textarea
        id="emotion-note"
        maxLength={120}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="예: 오늘은 혼자 감당하는 느낌이 컸어요"
      />
      <small>선택 입력이에요. 공유를 켜도 이 원문은 파트너에게 보내지 않아요.</small>

      <ConfirmChip selected={shareWithPartner} onClick={() => setShareWithPartner((value) => !value)} tone="lavender">
        파트너에게 조용한 도움 신호만 공유할래요
      </ConfirmChip>

      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={createCard} type="button">
        감정 기록 저장
      </CtaButton>

      {card ? (
        <Card as="article" data-testid="emotion-card" tone={card.partnerVisible ? 'lavender' : 'sage'}>
          <StatusBadge state={card.partnerVisible ? 'shared' : 'idle'}>{card.partnerVisible ? '공유됨' : '비공개'}</StatusBadge>
          <h2>{card.title}</h2>
          <p className="lead">{card.description}</p>
          <small>부담 정도 {card.intensity}/5 · 원문 메모는 파트너 화면에 보내지 않아요.</small>
        </Card>
      ) : null}
    </div>
  );
}
