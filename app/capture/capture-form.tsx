'use client';

import { useRef, useState } from 'react';
import { CtaButton, Notice } from '../../src/components/ui';

type Candidate = { sourceText: string; orderIndex: number };
type CaptureResponse = { visitInputId: string; draftId: string; candidates: Candidate[]; error?: string };

type CaptureFormProps = { initialRawText?: string; presentationMode?: boolean };

export function CaptureForm({ initialRawText = '', presentationMode = false }: CaptureFormProps) {
  const [rawText, setRawText] = useState(initialRawText);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  function choosePhoto(file: File | null) {
    setPhotoName(file?.name ?? null);
  }

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
      <section className="capture-camera" aria-label="사진 촬영 입력">
        <div>
          <strong>안내문을 사진으로 남기기</strong>
          <p>종이 안내문은 촬영해 두고, 확인한 문장만 아래에 옮겨 적어요.</p>
          {photoName ? <small>첨부됨 · {photoName}</small> : null}
        </div>
        <input
          ref={photoInputRef}
          aria-label="병원 안내문 사진 촬영"
          accept="image/*"
          capture="environment"
          className="capture-camera__input"
          onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)}
          type="file"
        />
        <button className="secondary-cta capture-camera__button" onClick={() => photoInputRef.current?.click()} type="button">
          사진으로 안내문 촬영
        </button>
      </section>
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
      {presentationMode ? (
        <button className="secondary-cta" onClick={() => setRawText(initialRawText)} type="button">
          데모 리셋
        </button>
      ) : null}
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={submitCapture} type="button">
        케어 흐름으로 나누기
      </CtaButton>
    </div>
  );
}
