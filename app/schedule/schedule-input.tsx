'use client';

import { FormEvent, useState } from 'react';
import { Card, CtaButton, Notice, SelectionChip, TimeInput } from '../../src/components/ui';

type Mode = 'add' | 'change' | 'cancel';
type Purpose = 'visit' | 'injection' | 'test' | 'procedure' | 'other';

type ScheduleResponse = {
  error?: string;
  summary?: string;
};

const PURPOSES: Array<{ value: Purpose; label: string }> = [
  { value: 'visit', label: '방문' },
  { value: 'injection', label: '주사' },
  { value: 'test', label: '검사' },
  { value: 'procedure', label: '시술' },
  { value: 'other', label: '기타' },
];

export function ScheduleInput() {
  const [mode, setMode] = useState<Mode>('add');
  const [purpose, setPurpose] = useState<Purpose>('visit');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<{ tone: 'sage' | 'coral'; message: string } | null>(null);
  const [confirmedSummary, setConfirmedSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setConfirmedSummary('');

    if (!date || !time) {
      setStatus({ tone: 'coral', message: '날짜와 시간만 채우면 저장할 수 있어요.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode, purpose, date, time, memo }),
      });
      const payload = (await response.json().catch(() => ({}))) as ScheduleResponse;

      if (!response.ok) {
        setStatus({ tone: 'coral', message: payload.error ?? '지금은 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
        return;
      }

      setConfirmedSummary(payload.summary ?? '일정이 저장되었어요.');
      setStatus({ tone: 'sage', message: '저장되었어요. 파트너에게 보이는 요약은 이 확정 내용만 사용해요.' });
    } finally {
      setSubmitting(false);
    }
  }

  function cancel() {
    setDate('');
    setTime('');
    setMemo('');
    setConfirmedSummary('');
      setStatus({ tone: 'sage', message: '저장을 멈췄어요. 필요할 때 다시 적어 주세요.' });
  }

  return (
    <main className="schedule-page" aria-labelledby="schedule-title">
      <Card className="schedule-card" tone="sage">
        <p className="schedule-eyebrow">Schedule</p>
        <h1 id="schedule-title">일정을 조용히 정리해요</h1>
        <p className="schedule-lede">확정된 날짜와 시간만 오늘 케어 흐름에 남겨요. 의료 판단이나 압박 없이, 내가 확인한 일정만 저장합니다.</p>
        <Notice tone="sage">취소하면 아무것도 저장하지 않아요.</Notice>

        <form className="schedule-form" onSubmit={submit}>
          <fieldset className="schedule-fieldset">
            <legend>무엇을 할까요?</legend>
            <div className="schedule-chip-row">
              <SelectionChip selected={mode === 'add'} onClick={() => setMode('add')}>새로 적을래요</SelectionChip>
              <SelectionChip selected={mode === 'change'} onClick={() => setMode('change')}>바꿀래요</SelectionChip>
              <SelectionChip selected={mode === 'cancel'} onClick={() => setMode('cancel')}>취소를 남길래요</SelectionChip>
            </div>
          </fieldset>

          <fieldset className="schedule-fieldset">
            <legend>일정 종류</legend>
            <div className="schedule-chip-row">
              {PURPOSES.map((option) => (
                <SelectionChip key={option.value} selected={purpose === option.value} onClick={() => setPurpose(option.value)}>
                  {option.label}
                </SelectionChip>
              ))}
            </div>
          </fieldset>

          <div className="schedule-grid">
            <label className="schedule-date-input">
              <span>날짜</span>
              <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
            </label>
            <TimeInput label="시간" id="schedule-time" value={time} onChange={(event) => setTime(event.target.value)} helperText="대략적인 시간으로도 저장할 수 있어요." />
          </div>

          <label className="schedule-memo-input">
            <span>메모</span>
            <textarea maxLength={80} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="예: 채혈 확인" />
            <small>선택 입력이에요. 짧게만 남겨도 충분해요.</small>
          </label>

          {status ? <Notice tone={status.tone}>{status.message}</Notice> : null}
          {confirmedSummary ? <Card as="article" className="schedule-summary" tone="lavender">{confirmedSummary}</Card> : null}

          <div className="schedule-actions">
            <CtaButton disabled={submitting} type="submit">{submitting ? '저장 중이에요' : mode === 'cancel' ? '이 취소 내용을 저장' : '이 일정으로 저장'}</CtaButton>
            <CtaButton disabled={submitting} onClick={cancel} type="button" variant="ghost">그만둘게요</CtaButton>
          </div>
        </form>
      </Card>
    </main>
  );
}
