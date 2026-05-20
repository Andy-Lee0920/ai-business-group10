'use client';

import { useState, type FormEvent } from 'react';
import type { CoupleJournalEntry, JournalMood } from '../../../types/journal.types';

interface JournalPreviewProps {
  entries: CoupleJournalEntry[];
  upcomingCount: number;
}

const MOODS: { value: JournalMood; label: string }[] = [
  { value: 'calm', label: '차분' },
  { value: 'tired', label: '피곤' },
  { value: 'worried', label: '걱정' },
  { value: 'hopeful', label: '기대' },
  { value: 'unknown', label: '모름' },
];

export function JournalPreview({ entries, upcomingCount }: JournalPreviewProps) {
  const [journalEntries, setJournalEntries] = useState(entries);
  const [isSaving, setIsSaving] = useState(false);

  async function submitJournalEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/records/journal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          body,
          mood: formData.get('mood'),
          painScore: formData.get('painScore'),
        }),
      });
      const payload = await response.json().catch(() => ({})) as { entry?: CoupleJournalEntry };
      if (response.ok && payload.entry) {
        setJournalEntries((current) => [payload.entry as CoupleJournalEntry, ...current]);
        form.reset();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="부부간 기록" style={{ padding: '0 16px 14px' }}>
      <article data-testid="couple-journal-preview" style={primaryCardStyle}>
        <span style={sectionEyebrowStyle}>부부간</span>
        <h2 style={sectionTitleStyle}>오늘의 마음과 경험을 둘만 볼 수 있게 남겨요</h2>
        <p style={sectionBodyStyle}>남은 일정 {upcomingCount}개를 보며 오늘의 기분, 통증, 메모를 함께 남깁니다.</p>

        <form data-testid="couple-journal-form" onSubmit={submitJournalEntry} style={formStyle}>
          <label style={labelStyle}>
            오늘 기록
            <textarea name="body" required placeholder="오늘 병원 안내를 어떻게 확인했나요?" style={textareaStyle} />
          </label>
          <div style={formGridStyle}>
            <label style={labelStyle}>
              기분
              <select name="mood" defaultValue="calm" style={inputStyle}>
                {MOODS.map((mood) => <option key={mood.value} value={mood.value}>{mood.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              통증 점수
              <input name="painScore" type="number" min="0" max="10" inputMode="numeric" placeholder="0-10" style={inputStyle} />
            </label>
          </div>
          <button type="submit" disabled={isSaving} style={buttonStyle}>{isSaving ? '저장 중' : '부부간 기록 남기기'}</button>
        </form>

        <div style={listStyle}>
          {journalEntries.length === 0 ? (
            <p style={emptyStyle}>아직 남긴 기록이 없어요.</p>
          ) : journalEntries.map((entry) => (
            <article key={entry.id} style={entryStyle}>
              <div style={entryMetaStyle}>{formatDate(entry.createdAt)} · {entry.authorRole === 'partner' ? '파트너' : '나'}</div>
              <p style={entryBodyStyle}>{entry.body}</p>
              {entry.painScore !== null ? <span style={pillStyle}>통증 점수 {entry.painScore}</span> : null}
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '오늘';
  return parsed.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

const primaryCardStyle = { borderRadius: 28, background: 'rgba(255,255,255,0.86)', border: '1px solid var(--slc-border)', boxShadow: '0 18px 48px rgba(80, 50, 40, 0.08)', padding: 22 } as const;
const sectionEyebrowStyle = { display: 'inline-block', margin: '0 0 8px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const sectionTitleStyle = { color: 'var(--slc-text)', fontSize: 21, fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1.25, margin: 0 } as const;
const sectionBodyStyle = { color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0' } as const;
const formStyle = { display: 'grid', gap: 12, marginTop: 18 } as const;
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;
const labelStyle = { display: 'grid', gap: 7, color: 'var(--slc-text)', fontSize: 12, fontWeight: 900 } as const;
const textareaStyle = { minHeight: 74, border: '1px solid var(--slc-border)', borderRadius: 18, padding: 14, resize: 'vertical', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const inputStyle = { minHeight: 42, border: '1px solid var(--slc-border)', borderRadius: 16, padding: '0 12px', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const buttonStyle = { border: 0, borderRadius: 18, background: 'var(--fevio-coral)', color: '#fff', fontSize: 14, fontWeight: 950, minHeight: 46 } as const;
const listStyle = { display: 'grid', gap: 10, marginTop: 18 } as const;
const entryStyle = { borderRadius: 20, background: 'rgba(255, 252, 250, 0.88)', border: '1px solid var(--slc-border)', padding: 14 } as const;
const entryMetaStyle = { color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850, marginBottom: 7 } as const;
const entryBodyStyle = { color: 'var(--slc-text)', fontSize: 14, fontWeight: 800, lineHeight: 1.45, margin: 0 } as const;
const pillStyle = { display: 'inline-block', marginTop: 9, borderRadius: 999, background: 'rgba(185, 128, 103, 0.11)', color: 'var(--fevio-coral)', padding: '6px 9px', fontSize: 11, fontWeight: 900 } as const;
const emptyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 } as const;
