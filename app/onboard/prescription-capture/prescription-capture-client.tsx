'use client';

import { useState } from 'react';
import { CtaButton, Notice } from '../../../src/components/ui';
import styles from '../../onboarding/onboarding.module.css';

type PrescriptionCaptureResponse = { cardId?: string; title?: string; error?: string };

export function PrescriptionCaptureClient() {
  const [photoName, setPhotoName] = useState('');
  const [type, setType] = useState<'medication' | 'injection'>('medication');
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('21:00');
  const [administeredBy, setAdministeredBy] = useState<'self' | 'partner'>('self');
  const [doseConfirmed, setDoseConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState<PrescriptionCaptureResponse | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/prescription/capture', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        photoUrl: photoName ? `local-file:${photoName}` : 'manual-entry',
        type,
        name,
        dose,
        doseConfirmed,
        time,
        administeredBy,
      }),
    });
    const payload = (await response.json()) as PrescriptionCaptureResponse;
    if (!response.ok) {
      setError(payload.error ?? '처방 카드 초안을 만들지 못했어요.');
      setSubmitting(false);
      return;
    }
    setComplete(payload);
    setSubmitting(false);
  }

  return (
    <section className={styles.choiceSection} aria-labelledby="prescription-capture-title">
      <p className="eyebrow">Prescription Capture</p>
      <h1 className={styles.heroTitle} id="prescription-capture-title">처방 사진은 붙이고, 용량은 직접 확인해요</h1>
      <p className={`lead ${styles.heroLead}`}>사진은 근거로만 보관합니다. 약 이름·용량·시간은 사용자가 확인해야 카드가 만들어집니다.</p>
      {complete ? <Notice tone="sage">저장됐어요. {complete.title} 카드가 준비됐습니다. <a href="/home">홈으로 이동</a></Notice> : null}
      <label className="field-label" htmlFor="prescription-photo-input">처방전/약 봉투 사진</label>
      <input id="prescription-photo-input" className="text-input" type="file" accept="image/*" capture="environment" onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? '')} />
      <label className="field-label" htmlFor="prescription-type">카드 종류</label>
      <select id="prescription-type" className="text-input" value={type} onChange={(event) => setType(event.target.value as 'medication' | 'injection')}>
        <option value="medication">약</option>
        <option value="injection">주사</option>
      </select>
      <label className="field-label" htmlFor="prescription-name">약 이름</label>
      <input id="prescription-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 프로게스테론" />
      <label className="field-label" htmlFor="prescription-dose">직접 확인한 용량</label>
      <input id="prescription-dose" className="text-input" value={dose} onChange={(event) => setDose(event.target.value)} placeholder="예: 1mL" />
      <label className="field-label" htmlFor="prescription-time">복용/주사 시간</label>
      <input id="prescription-time" className="text-input" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
      <label className="field-label" htmlFor="prescription-owner">실행자</label>
      <select id="prescription-owner" className="text-input" value={administeredBy} onChange={(event) => setAdministeredBy(event.target.value as 'self' | 'partner')}>
        <option value="self">내가 실행</option>
        <option value="partner">파트너 도움</option>
      </select>
      <label className={styles.inlineCheck} htmlFor="dose-confirmed">
        <input id="dose-confirmed" type="checkbox" checked={doseConfirmed} onChange={(event) => setDoseConfirmed(event.target.checked)} />
        이름과 용량을 처방전 원문으로 직접 확인했어요.
      </label>
      {error ? <Notice tone="coral">{error}</Notice> : null}
      <CtaButton disabled={submitting || !name || !dose || !doseConfirmed} onClick={submit} type="button">확인 카드 만들기</CtaButton>
    </section>
  );
}
