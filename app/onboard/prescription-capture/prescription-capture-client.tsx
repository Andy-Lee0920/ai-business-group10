'use client';

import { useState } from 'react';
import { CtaButton, Notice } from '../../../src/components/ui';
import styles from '../../onboarding/onboarding.module.css';

type CandidateType = 'medication' | 'injection' | 'clinic';
type Candidate = {
  id: string;
  type: CandidateType;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
};
type AnalyzeResponse = { candidates?: Candidate[]; path?: string; error?: string };
type ConfirmResponse = { savedCount?: number; items?: Array<{ title?: string }>; error?: string };

export function PrescriptionCaptureClient() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDose, setManualDose] = useState('');
  const [manualTime, setManualTime] = useState('21:00');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState<ConfirmResponse | null>(null);

  async function extractCandidates() {
    setSubmitting(true);
    setError(null);
    setComplete(null);
    try {
      const payload = photo ? await uploadAndAnalyzePhoto(photo) : await analyzeText(buildManualText(rawText, manualName, manualDose, manualTime));
      const nextCandidates = payload.candidates ?? [];
      if (nextCandidates.length === 0) {
        setError('카드 후보를 찾지 못했어요. 아래에 병원 안내를 조금 더 자세히 적어주세요.');
        return;
      }
      setCandidates(nextCandidates);
      setConfirmedIds(new Set(nextCandidates.map((candidate) => candidate.id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '카드 후보를 만들지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCandidates() {
    setSubmitting(true);
    setError(null);
    try {
      const confirmed = candidates.filter((candidate) => confirmedIds.has(candidate.id));
      const rejected = candidates.filter((candidate) => !confirmedIds.has(candidate.id));
      const response = await fetch('/api/onboard/candidates/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          confirmedIds: confirmed.map((candidate) => candidate.id),
          rejectedIds: rejected.map((candidate) => candidate.id),
          candidateEdits: candidates.map(toCandidateEdit),
        }),
      });
      const payload = (await response.json()) as ConfirmResponse;
      if (!response.ok) throw new Error(payload.error ?? '확인한 카드를 저장하지 못했어요.');
      setComplete(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '확인한 카드를 저장하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  function updateCandidate(id: string, patch: Partial<Candidate>) {
    setCandidates((current) => current.map((candidate) => candidate.id === id ? { ...candidate, ...patch } : candidate));
  }

  function toggleCandidate(id: string, checked: boolean) {
    setConfirmedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <section className={styles.choiceSection} aria-labelledby="prescription-capture-title">
      <p className="eyebrow">Prescription Capture</p>
      <h1 className={styles.heroTitle} id="prescription-capture-title">사진 한 장을 확인 카드로 바꿔요</h1>
      <p className={`lead ${styles.heroLead}`}>사진이나 텍스트에서 후보를 만들고, 저장 전에는 반드시 직접 확인합니다.</p>

      {complete ? <Notice tone="sage">저장됐어요. {complete.savedCount ?? 0}개 카드가 준비됐습니다. <a href="/home">홈으로 이동</a></Notice> : null}

      <label className="field-label" htmlFor="prescription-photo-input">병원 안내문 사진</label>
      <input id="prescription-photo-input" className="text-input" type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />

      <label className="field-label" htmlFor="prescription-raw-text">사진이 없으면 직접 입력</label>
      <textarea id="prescription-raw-text" className="text-input" value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="예: 오늘 밤 9시 오비드렐 250mcg 주사" rows={3} />

      <details>
        <summary className="field-label">직접 입력 빠른 보정</summary>
        <label className="field-label" htmlFor="prescription-name">약 이름</label>
        <input id="prescription-name" className="text-input" value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="예: 오비드렐" />
        <label className="field-label" htmlFor="prescription-dose">용량</label>
        <input id="prescription-dose" className="text-input" value={manualDose} onChange={(event) => setManualDose(event.target.value)} placeholder="예: 250mcg" />
        <label className="field-label" htmlFor="prescription-time">시간</label>
        <input id="prescription-time" className="text-input" type="time" value={manualTime} onChange={(event) => setManualTime(event.target.value)} />
      </details>

      {candidates.length > 0 ? (
        <div aria-label="카드 후보 확인" style={{ display: 'grid', gap: 12 }}>
          <p className="field-label">확인 후 저장</p>
          {candidates.map((candidate, index) => (
            <article key={candidate.id} style={{ border: '1px solid var(--slc-border)', borderRadius: 18, padding: 14, background: '#fff' }}>
              <label className={styles.inlineCheck} htmlFor={`candidate-${candidate.id}`}>
                <input id={`candidate-${candidate.id}`} type="checkbox" checked={confirmedIds.has(candidate.id)} onChange={(event) => toggleCandidate(candidate.id, event.target.checked)} />
                {index + 1}번 후보 저장
              </label>
              <label className="field-label" htmlFor={`candidate-type-${candidate.id}`}>카드 타입</label>
              <select id={`candidate-type-${candidate.id}`} className="text-input" value={candidate.type} onChange={(event) => updateCandidate(candidate.id, { type: event.target.value as CandidateType })}>
                <option value="injection">주사</option>
                <option value="medication">약</option>
                <option value="clinic">병원 방문</option>
              </select>
              <label className="field-label" htmlFor={`candidate-title-${candidate.id}`}>제목</label>
              <input id={`candidate-title-${candidate.id}`} className="text-input" value={candidate.title} onChange={(event) => updateCandidate(candidate.id, { title: event.target.value })} />
              <label className="field-label" htmlFor={`candidate-dose-${candidate.id}`}>용량/메모</label>
              <input id={`candidate-dose-${candidate.id}`} className="text-input" value={formatDose(candidate)} onChange={(event) => updateCandidate(candidate.id, { dose: event.target.value, unit: null })} />
            </article>
          ))}
          <CtaButton disabled={submitting || confirmedIds.size === 0} onClick={confirmCandidates} type="button">확인 후 저장</CtaButton>
        </div>
      ) : (
        <CtaButton disabled={submitting || (!photo && !rawText.trim() && !manualName.trim())} onClick={extractCandidates} type="button">카드 후보 만들기</CtaButton>
      )}

      {error ? <Notice tone="coral">{error}</Notice> : null}
    </section>
  );
}

async function uploadAndAnalyzePhoto(file: File) {
  const form = new FormData();
  form.append('file', file);
  const upload = await fetch('/api/onboard/photo-upload', { method: 'POST', body: form });
  const uploadPayload = (await upload.json()) as AnalyzeResponse;
  if (!upload.ok || !uploadPayload.path) throw new Error(uploadPayload.error ?? '사진을 올리지 못했어요.');

  const analyze = await fetch('/api/onboard/photo-analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imagePath: uploadPayload.path }),
  });
  const analyzePayload = (await analyze.json()) as AnalyzeResponse;
  if (!analyze.ok) throw new Error(analyzePayload.error ?? '사진에서 카드 후보를 만들지 못했어요.');
  return analyzePayload;
}

async function analyzeText(rawText: string) {
  const response = await fetch('/api/onboard/text-analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });
  const payload = (await response.json()) as AnalyzeResponse;
  if (!response.ok) throw new Error(payload.error ?? '텍스트에서 카드 후보를 만들지 못했어요.');
  return payload;
}

function buildManualText(rawText: string, name: string, dose: string, time: string) {
  const manualLine = name.trim() ? `${time || '21:00'} ${name.trim()}${dose.trim() ? ` ${dose.trim()}` : ''}` : '';
  return [rawText.trim(), manualLine].filter(Boolean).join('\n');
}

function toCandidateEdit(candidate: Candidate) {
  return {
    id: candidate.id,
    type: candidate.type,
    title: candidate.title,
    scheduled_at: candidate.scheduled_at,
    dose: candidate.dose,
    unit: candidate.unit,
  };
}

function formatDose(candidate: Candidate) {
  return [candidate.dose, candidate.unit].filter(Boolean).join(' ');
}
