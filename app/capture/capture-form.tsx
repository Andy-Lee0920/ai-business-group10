'use client';

import { useState } from 'react';
import { CtaButton, Notice } from '../../src/components/ui';

type Candidate = { sourceText: string; orderIndex: number };
type CaptureResponse = { visitInputId: string; draftId: string; candidates: Candidate[]; error?: string };

export function CaptureForm() {
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitCapture() {
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/capture', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });
    const payload = (await response.json()) as CaptureResponse;

    if (!response.ok) {
      setError(payload.error ?? '메모를 저장하지 못했습니다.');
      setSubmitting(false);
      return;
    }

    sessionStorage.setItem('fevio.splitReview', JSON.stringify(payload));
    window.location.href = `/split-review?draftId=${encodeURIComponent(payload.draftId)}`;
  }

  return (
    <div className="capture-form">
      <label className="field-label" htmlFor="capture-memo">
        병원에서 들은 내용
      </label>
      <textarea
        id="capture-memo"
        name="rawText"
        onChange={(event) => setRawText(event.target.value)}
        placeholder="예: 오늘 밤 10시 오비드렐 주사\n내일 오전 병원 방문\n남편이 주사 준비 도와주기"
        rows={9}
        value={rawText}
      />
      <div className="helper-row" aria-label="입력 보조">
        <span>붙여넣기 가능</span>
        <span>음성 입력은 기기 키보드 마이크를 사용해 주세요</span>
      </div>
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={submitCapture} type="button">
        실행 카드로 나누기
      </CtaButton>
    </div>
  );
}
