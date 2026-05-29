'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { shouldAnalyzeManualPrescriptionFallback } from '../../../src/domain/prescription-capture';

type CandidateType = 'medication' | 'injection' | 'clinic';
type Candidate = {
  id: string;
  type: CandidateType;
  title: string;
  scheduled_at: string | null;
  dose: string | null;
  unit: string | null;
  assignedTo?: 'my_action' | 'partner_action';
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
      const manualText = buildManualText(rawText, manualName, manualDose, manualTime);
      const payload = photo ? await uploadAndAnalyzePhoto(photo) : await analyzeText(manualText);
      const fallbackPayload = shouldAnalyzeManualPrescriptionFallback({
        hasPhoto: Boolean(photo),
        candidateCount: (payload.candidates ?? []).length,
        manualText,
      })
        ? await analyzeText(manualText)
        : payload;
      const nextCandidates = fallbackPayload.candidates ?? [];
      if (nextCandidates.length === 0) {
        setError('확인할 일정을 찾지 못했어요. 병원 안내 내용을 조금 더 자세히 적어주세요.');
        return;
      }
      setCandidates(nextCandidates);
      setConfirmedIds(new Set(nextCandidates.map((candidate) => candidate.id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '병원 안내에서 일정을 정리하지 못했어요.');
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
      if (!response.ok) throw new Error(payload.error ?? '확인한 일정을 저장하지 못했어요.');
      setComplete(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '확인한 일정을 저장하지 못했어요.');
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

  const extractDisabled = submitting || (!photo && !rawText.trim() && !manualName.trim());
  const confirmDisabled = submitting || confirmedIds.size === 0;

  return (
    <section style={screenStyle} aria-labelledby="prescription-capture-title">
      <Link href="/home" aria-label="홈으로 돌아가기" style={exitLinkStyle}>
        <span aria-hidden="true">‹</span> 홈으로
      </Link>
      <header style={heroStyle}>
        <div aria-hidden="true" style={heroIconStyle}>
          <span style={heroIconPaperStyle} />
          <span style={heroIconCheckStyle}>✓</span>
        </div>
        <p style={eyebrowStyle}>병원 안내 입력</p>
        <h1 style={titleStyle} id="prescription-capture-title">병원 안내문을 사진으로 남겨주세요</h1>
        <p style={leadStyle}>처방지나 안내문을 찍어주시면 확인할 일정 후보만 정리해요. 저장 전에는 직접 확인해요.</p>
      </header>

      {complete ? (
        <div style={successStyle} role="status">
          <strong>확인한 일정이 저장됐어요</strong>
          <span>{complete.savedCount ?? 0}개 일정이 홈과 캘린더에 준비됐습니다.</span>
          <a href="/home" style={secondaryActionStyle}>홈으로 이동</a>
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <div aria-label="카드 후보 확인" style={candidateSectionStyle}>
          <div style={sectionHeaderStyle}>
            <p style={sectionKickerStyle}>확인 후 저장</p>
            <h2 style={sectionTitleStyle}>정리된 일정이 맞는지 확인해주세요</h2>
            <span style={sectionDescriptionStyle}>틀린 내용은 바로 고치고, 확실한 일정만 저장해요.</span>
          </div>
          {candidates.map((candidate, index) => (
            <article key={candidate.id} style={candidateCardStyle}>
              <label style={inlineCheckStyle} htmlFor={`candidate-${candidate.id}`}>
                <input id={`candidate-${candidate.id}`} type="checkbox" checked={confirmedIds.has(candidate.id)} onChange={(event) => toggleCandidate(candidate.id, event.target.checked)} />
                {index + 1}번 일정 저장
              </label>
              <label style={fieldLabelStyle} htmlFor={`candidate-type-${candidate.id}`}>일정 종류</label>
              <select id={`candidate-type-${candidate.id}`} style={inputStyle} value={candidate.type} onChange={(event) => updateCandidate(candidate.id, { type: event.target.value as CandidateType })}>
                <option value="injection">주사</option>
                <option value="medication">약</option>
                <option value="clinic">병원 방문</option>
              </select>
              <label style={fieldLabelStyle} htmlFor={`candidate-owner-${candidate.id}`}>담당</label>
              <select
                id={`candidate-owner-${candidate.id}`}
                style={inputStyle}
                value={candidate.assignedTo ?? 'my_action'}
                onChange={(event) => updateCandidate(candidate.id, { assignedTo: event.target.value as Candidate['assignedTo'] })}
              >
                <option value="my_action">내가 확인할 일정</option>
                <option value="partner_action">파트너가 도와줄 일정</option>
              </select>
              <label style={fieldLabelStyle} htmlFor={`candidate-title-${candidate.id}`}>제목</label>
              <input id={`candidate-title-${candidate.id}`} style={inputStyle} value={candidate.title} onChange={(event) => updateCandidate(candidate.id, { title: event.target.value })} />
              <label style={fieldLabelStyle} htmlFor={`candidate-time-${candidate.id}`}>후보 시간</label>
              <input
                id={`candidate-time-${candidate.id}`}
                style={inputStyle}
                type="datetime-local"
                value={toDateTimeLocal(candidate.scheduled_at)}
                onChange={(event) => updateCandidate(candidate.id, { scheduled_at: fromDateTimeLocal(event.target.value) })}
              />
              <label style={fieldLabelStyle} htmlFor={`candidate-dose-${candidate.id}`}>용량/메모</label>
              <input id={`candidate-dose-${candidate.id}`} style={inputStyle} value={formatDose(candidate)} onChange={(event) => updateCandidate(candidate.id, { dose: event.target.value, unit: null })} />
            </article>
          ))}
          <button style={confirmDisabled ? disabledPrimaryButtonStyle : primaryButtonStyle} disabled={confirmDisabled} onClick={confirmCandidates} type="button">확인 후 저장</button>
        </div>
      ) : (
        <>
          <div style={captureStackStyle}>
            <label style={photoCardStyle} htmlFor="prescription-photo-input">
              <span style={smallLabelStyle}>병원 안내문 사진</span>
              <span style={photoTitleStyle}>안내문 찍기</span>
              <span style={photoDescriptionStyle}>{photo ? photo.name : '카메라로 처방지나 안내문을 촬영해요'}</span>
              <span aria-hidden="true" style={photoArrowStyle}>›</span>
            </label>
            <input
              id="prescription-photo-input"
              style={hiddenFileInputStyle}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />

            <label style={fieldLabelStyle} htmlFor="prescription-raw-text">문자로 받은 안내 붙여넣기</label>
            <textarea
              id="prescription-raw-text"
              style={textareaStyle}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="예: 오늘 밤 9시 오비드렐 250mcg 주사"
              rows={4}
            />

            <details style={detailsStyle}>
              <summary style={summaryStyle}>직접 적어야 할 때</summary>
              <div style={manualGridStyle}>
                <label style={fieldLabelStyle} htmlFor="prescription-name">이름</label>
                <input id="prescription-name" style={inputStyle} value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="예: 오비드렐" />
                <label style={fieldLabelStyle} htmlFor="prescription-dose">용량</label>
                <input id="prescription-dose" style={inputStyle} value={manualDose} onChange={(event) => setManualDose(event.target.value)} placeholder="예: 250mcg" />
                <label style={fieldLabelStyle} htmlFor="prescription-time">시간</label>
                <input id="prescription-time" style={inputStyle} type="time" value={manualTime} onChange={(event) => setManualTime(event.target.value)} />
              </div>
            </details>
          </div>

          <button
            aria-label="카드 후보 만들기"
            style={extractDisabled ? disabledPrimaryButtonStyle : primaryButtonStyle}
            disabled={extractDisabled}
            onClick={extractCandidates}
            type="button"
          >
            {submitting ? '확인 중이에요' : '안내문 확인하기'}
          </button>
        </>
      )}

      {error ? <div style={errorStyle} role="alert">{error}</div> : null}
    </section>
  );
}

const screenStyle: CSSProperties = {
  minHeight: '100%',
  padding: '38px 24px 34px',
  display: 'grid',
  alignContent: 'start',
  gap: 22,
};

const exitLinkStyle: CSSProperties = {
  justifySelf: 'start',
  minHeight: 42,
  padding: '0 15px',
  borderRadius: 999,
  border: '1px solid rgba(224, 197, 181, 0.78)',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#6f625b',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 900,
  boxShadow: '0 10px 22px rgba(99, 74, 58, 0.08)',
};

const heroStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  textAlign: 'center',
  gap: 12,
};

const heroIconStyle: CSSProperties = {
  width: 108,
  height: 108,
  borderRadius: 30,
  background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(248,232,219,0.72))',
  boxShadow: '0 18px 38px rgba(121, 82, 63, 0.12)',
  display: 'grid',
  placeItems: 'center',
  position: 'relative',
};

const heroIconPaperStyle: CSSProperties = {
  width: 44,
  height: 54,
  borderRadius: 14,
  background: '#fffaf5',
  boxShadow: 'inset 0 0 0 3px rgba(207, 96, 77, 0.14)',
};

const heroIconCheckStyle: CSSProperties = {
  position: 'absolute',
  right: 24,
  bottom: 24,
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#e86d57',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 900,
  fontSize: 18,
};

const eyebrowStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 13,
  fontWeight: 900,
  color: '#6f8a65',
  letterSpacing: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: '#2c211d',
  fontSize: 38,
  lineHeight: 1.12,
  fontWeight: 900,
  letterSpacing: 0,
  wordBreak: 'keep-all',
};

const leadStyle: CSSProperties = {
  margin: 0,
  maxWidth: 336,
  color: '#7c706a',
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 700,
  wordBreak: 'keep-all',
};

const captureStackStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const photoCardStyle: CSSProperties = {
  minHeight: 120,
  borderRadius: 28,
  border: '1px solid rgba(224, 197, 181, 0.82)',
  background: 'rgba(255, 255, 255, 0.84)',
  boxShadow: '0 18px 46px rgba(99, 74, 58, 0.10)',
  padding: '24px 58px 24px 24px',
  display: 'grid',
  alignContent: 'center',
  gap: 7,
  position: 'relative',
  cursor: 'pointer',
};

const smallLabelStyle: CSSProperties = {
  color: '#6f8a65',
  fontSize: 12,
  fontWeight: 900,
};

const photoTitleStyle: CSSProperties = {
  color: '#2d231f',
  fontSize: 22,
  fontWeight: 900,
};

const photoDescriptionStyle: CSSProperties = {
  color: '#85786f',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.45,
  overflowWrap: 'anywhere',
};

const photoArrowStyle: CSSProperties = {
  position: 'absolute',
  right: 24,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#c95d4b',
  fontSize: 32,
  fontWeight: 700,
};

const hiddenFileInputStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};

const fieldLabelStyle: CSSProperties = {
  color: '#655b55',
  fontSize: 13,
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid rgba(224, 197, 181, 0.9)',
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.84)',
  color: '#2d231f',
  fontSize: 15,
  fontWeight: 700,
  padding: '13px 14px',
  outline: 'none',
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 112,
  resize: 'vertical',
  lineHeight: 1.5,
};

const detailsStyle: CSSProperties = {
  borderRadius: 22,
  border: '1px solid rgba(224, 197, 181, 0.72)',
  background: 'rgba(255, 255, 255, 0.58)',
  padding: '14px 16px',
};

const summaryStyle: CSSProperties = {
  color: '#655b55',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
};

const manualGridStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  paddingTop: 14,
};

const primaryButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: 58,
  border: 0,
  borderRadius: 999,
  background: 'linear-gradient(180deg, #ee765f 0%, #df5f4f 100%)',
  color: '#fff',
  fontSize: 17,
  fontWeight: 900,
  boxShadow: '0 18px 36px rgba(205, 91, 72, 0.24)',
  cursor: 'pointer',
};

const disabledPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: 'rgba(214, 196, 185, 0.72)',
  color: 'rgba(68, 55, 48, 0.52)',
  boxShadow: 'none',
  cursor: 'not-allowed',
};

const candidateSectionStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const sectionHeaderStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
};

const sectionKickerStyle: CSSProperties = {
  margin: 0,
  color: '#6f8a65',
  fontSize: 12,
  fontWeight: 900,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: '#2d231f',
  fontSize: 22,
  lineHeight: 1.25,
  fontWeight: 900,
  wordBreak: 'keep-all',
};

const sectionDescriptionStyle: CSSProperties = {
  color: '#81756d',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5,
};

const candidateCardStyle: CSSProperties = {
  border: '1px solid rgba(224, 197, 181, 0.82)',
  borderRadius: 24,
  padding: 16,
  background: 'rgba(255, 255, 255, 0.86)',
  boxShadow: '0 14px 34px rgba(99, 74, 58, 0.09)',
  display: 'grid',
  gap: 10,
};

const inlineCheckStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#2d231f',
  fontSize: 16,
  fontWeight: 900,
};

const successStyle: CSSProperties = {
  borderRadius: 22,
  border: '1px solid rgba(130, 159, 115, 0.32)',
  background: 'rgba(246, 252, 242, 0.88)',
  color: '#37523a',
  padding: 16,
  display: 'grid',
  gap: 8,
  fontSize: 14,
  fontWeight: 700,
};

const secondaryActionStyle: CSSProperties = {
  color: '#c85c4b',
  fontWeight: 900,
  textDecoration: 'none',
};

const errorStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(212, 87, 70, 0.22)',
  background: 'rgba(255, 245, 241, 0.92)',
  color: '#a84638',
  padding: 14,
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.5,
};

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
    assignedTo: candidate.assignedTo ?? 'my_action',
  };
}

function formatDose(candidate: Candidate) {
  return [candidate.dose, candidate.unit].filter(Boolean).join(' ');
}

function toDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
