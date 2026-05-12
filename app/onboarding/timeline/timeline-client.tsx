'use client';

import { useState } from 'react';
import { CtaButton, Notice } from '../../../src/components/ui';
import type { TreatmentMilestoneKind } from '../../../src/types/treatment-timeline.types';
import styles from '../onboarding.module.css';

type SaveState = 'idle' | 'saving' | 'saved';
type ApiResponse = { error?: string; redirectTo?: string; careSurface?: { phaseCareDay: string; surfaceCareDay: string } };

const MILESTONES: Array<{ value: TreatmentMilestoneKind; label: string }> = [
  { value: 'stimulation_start', label: '자극 시작일' },
  { value: 'initial_visit', label: '초진 날짜' },
  { value: 'trigger_shot', label: '트리거 주사일' },
  { value: 'egg_retrieval', label: '난자 채취일' },
  { value: 'embryo_transfer', label: '배아 이식일' },
  { value: 'result_day', label: '결과 확인일' },
];

export function MilestoneInputForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [startedAt, setStartedAt] = useState(today);
  const [milestone, setMilestone] = useState<TreatmentMilestoneKind>('stimulation_start');
  const [confirmedAt, setConfirmedAt] = useState(today);
  const [notes, setNotes] = useState('');
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setState('saving');
    setMessage(null);
    const response = await fetch('/api/treatment/milestone', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startedAt, milestone, confirmedAt, notes }),
    });
    const payload = (await response.json()) as ApiResponse;
    if (!response.ok) {
      setState('idle');
      setMessage(payload.error ?? '치료 여정 날짜를 저장하지 못했어요.');
      return;
    }
    setState('saved');
    setMessage(`저장됐어요. 오늘 홈 기준: ${payload.careSurface?.surfaceCareDay ?? 'routine_day'}`);
    window.setTimeout(() => {
      window.location.href = payload.redirectTo ?? '/home';
    }, 250);
  }

  return (
    <section className={`${styles.choiceSection} ${styles.interviewSlide}`} aria-labelledby="milestone-input-title">
      <h2 className={styles.sectionTitle} id="milestone-input-title">확정된 날짜만 먼저 남겨요</h2>
      <p className={styles.questionLead}>병원에서 들은 날짜가 바뀌면 나중에 새로 업데이트할 수 있어요.</p>

      <label className="field-label" htmlFor="timeline-started-at">초진 또는 시작 날짜</label>
      <input id="timeline-started-at" lang="ko-KR" type="date" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} />

      <label className="field-label" htmlFor="timeline-milestone">어떤 일이었나요?</label>
      <select id="timeline-milestone" value={milestone} onChange={(event) => setMilestone(event.target.value as TreatmentMilestoneKind)}>
        {MILESTONES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <label className="field-label" htmlFor="timeline-confirmed-at">확정 날짜</label>
      <input id="timeline-confirmed-at" lang="ko-KR" type="date" value={confirmedAt} onChange={(event) => setConfirmedAt(event.target.value)} />

      <label className="field-label" htmlFor="timeline-notes">짧은 메모 선택</label>
      <textarea id="timeline-notes" className={styles.textArea} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="예: 병원에서 다음 방문 때 다시 확인하기로 함" />

      <div className={styles.timelinePreview} aria-label="저장될 치료 여정 미리보기">
        <strong>TreatmentTimeline</strong>
        <span>{startedAt} · {MILESTONES.find((item) => item.value === milestone)?.label} · {confirmedAt}</span>
      </div>

      <CtaButton disabled={state === 'saving'} onClick={submit} type="button">{state === 'saving' ? '저장 중' : '치료 여정 저장하고 홈 보기'}</CtaButton>
      {message ? <Notice tone={state === 'saved' ? 'sage' : 'coral'}>{message}</Notice> : null}
    </section>
  );
}
