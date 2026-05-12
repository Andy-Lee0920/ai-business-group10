'use client';

import { useState } from 'react';
import { CtaButton, Notice } from '../../../src/components/ui';
import styles from '../../onboarding/onboarding.module.css';

type QuickCaptureResponse = { redirectTo?: string; error?: string };

export function QuickCaptureClient() {
  const [firstMedicationTime, setFirstMedicationTime] = useState('21:00');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [photoSkipped, setPhotoSkipped] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [complete, setComplete] = useState<QuickCaptureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/onboarding/quick-capture', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstMedicationTime,
        nextVisitDate,
        prescriptionPhotoUploadFailed: photoSkipped,
        prescriptionPhotoUrl: photoName ? `local-file:${photoName}` : undefined,
      }),
    });
    const payload = (await response.json()) as QuickCaptureResponse;
    if (!response.ok) {
      setError(payload.error ?? 'Quick Capture를 저장하지 못했어요.');
      setSubmitting(false);
      return;
    }
    setComplete(payload);
    setSubmitting(false);
  }

  return (
    <section className={styles.choiceSection} aria-labelledby="quick-capture-title">
      <p className="eyebrow">Quick Capture</p>
      <h1 className={styles.heroTitle} id="quick-capture-title">병원에서 나온 직후 3분만 기록해요</h1>
      <p className={`lead ${styles.heroLead}`}>약 이름과 용량은 지금 입력하지 않아도 됩니다. 시간과 다음 방문일만 먼저 홈에 올려요.</p>
      {complete ? (
        <Notice tone="sage">저장됐어요. 홈에서 Today Card를 확인할 수 있어요. <a href={complete.redirectTo ?? '/home'}>홈으로 이동</a></Notice>
      ) : null}
      <Notice tone="sage">처방전 사진 업로드가 실패해도 건너뛰고 계속 진행할 수 있어요.</Notice>
      <label className="field-label" htmlFor="prescription-photo">처방전/약 봉투 사진</label>
      <input id="prescription-photo" className="text-input" type="file" accept="image/*" capture="environment" onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? '')} />
      <button id="prescription-photo-skip" className={styles.choiceChip} type="button" onClick={() => setPhotoSkipped((value) => !value)} aria-pressed={photoSkipped}>
        {photoSkipped ? '사진은 나중에 추가하기' : '사진 업로드 건너뛰기'}
      </button>
      <label className="field-label" htmlFor="first-medication-time">오늘 첫 약/주사 시간</label>
      <input id="first-medication-time" className="text-input" type="time" value={firstMedicationTime} onChange={(event) => setFirstMedicationTime(event.target.value)} />
      <label className="field-label" htmlFor="next-visit-date">다음 병원 방문 예정일</label>
      <input id="next-visit-date" className="text-input" type="date" value={nextVisitDate} onChange={(event) => setNextVisitDate(event.target.value)} />
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting} onClick={submit} type="button">Today Card 만들기</CtaButton>
    </section>
  );
}
