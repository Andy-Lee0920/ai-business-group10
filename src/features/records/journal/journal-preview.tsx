'use client';

import { useState, type FormEvent } from 'react';
import type { CoupleJournalEntry, JournalMood } from '../../../types/journal.types';
import { createFevioBrowserAuthClient } from '../../../lib/browser-auth-client';

interface JournalPreviewProps {
  entries: CoupleJournalEntry[];
  upcomingCount: number;
  isPartnerLinked: boolean;
  coupleId: string | null;
  autoOpenCompose?: boolean;
  compactLocked?: boolean;
}

const MOODS: { value: JournalMood; label: string }[] = [
  { value: 'calm', label: '차분' },
  { value: 'tired', label: '피곤' },
  { value: 'worried', label: '걱정' },
  { value: 'hopeful', label: '기대' },
  { value: 'unknown', label: '모름' },
];

export function JournalPreview({ entries, upcomingCount, isPartnerLinked, coupleId, autoOpenCompose = false, compactLocked = false }: JournalPreviewProps) {
  const [journalEntries, setJournalEntries] = useState(entries);
  const [isSaving, setIsSaving] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(autoOpenCompose || entries.length === 0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  async function submitJournalEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;
    setIsSaving(true);
    try {
      const photoUrls = await uploadJournalPhotos(selectedFiles, coupleId);
      const response = await fetch('/api/records/journal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          body,
          mood: formData.get('mood'),
          painScore: formData.get('painScore'),
          photoUrls,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { entry?: CoupleJournalEntry };
      if (response.ok && payload.entry) {
        setJournalEntries((current) => [payload.entry as CoupleJournalEntry, ...current]);
        form.reset();
        setSelectedFiles([]);
        setIsComposerOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="커플저널" style={{ padding: '0 0 14px' }}>
      {!isPartnerLinked ? (
        <article data-testid="couple-journal-locked" style={lockedStyle}>
          <span style={sectionEyebrowStyle}>커플저널</span>
          <h2 style={sectionTitleStyle}>파트너 연결 후 둘만의 기록을 시작할 수 있어요</h2>
          <p style={sectionBodyStyle}>커플저널은 둘만 보는 shared space라서 파트너 연결이 완료된 뒤 작성할 수 있어요. 기존 기록은 연결 상태가 바뀌어도 보존됩니다.</p>
          <a href="/more#partner-invite" style={inviteLinkStyle}>파트너 초대하기</a>
        </article>
      ) : null}
      {compactLocked ? null : <article data-testid="couple-journal-preview" style={feedStyle}>
        <div style={feedHeaderStyle}>
          <div>
            <span style={sectionEyebrowStyle}>커플저널</span>
            <h2 style={sectionTitleStyle}>둘만의 기록</h2>
            <p style={sectionBodyStyle}>남은 일정 {upcomingCount}개를 보며 오늘의 기분과 사진을 함께 남깁니다.</p>
          </div>
          {isPartnerLinked ? <button type="button" data-testid="records-compose-button" onClick={() => setIsComposerOpen(true)} style={floatingButtonStyle}>＋</button> : null}
        </div>

        {isPartnerLinked && isComposerOpen ? (
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
          <label style={labelStyle}>
            사진
            <input
              name="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setSelectedFiles(Array.from(event.currentTarget.files ?? []).slice(0, 6))}
              style={fileInputStyle}
            />
          </label>
          {selectedFiles.length > 0 ? (
            <div style={thumbnailRowStyle}>
              {selectedFiles.map((file) => <span key={`${file.name}-${file.size}`} style={thumbnailPillStyle}>{file.name}</span>)}
            </div>
          ) : null}
          <button type="submit" disabled={isSaving} style={buttonStyle}>{isSaving ? '저장 중' : '부부간 기록 남기기'}</button>
        </form>
        ) : null}

        <div style={listStyle}>
          {journalEntries.length === 0 ? (
            <p style={emptyStyle}>{isPartnerLinked ? '둘만의 첫 기록을 남겨보세요.' : '파트너 연결 후 기록을 남길 수 있어요.'}</p>
          ) : journalEntries.map((entry) => (
            <article key={entry.id} style={entryStyle}>
              <div style={entryMetaStyle}>{formatDate(entry.createdAt)} · {entry.authorRole === 'partner' ? '파트너' : '나'}</div>
              <p style={entryBodyStyle}>{entry.body}</p>
              {entry.photoUrls.length > 0 ? (
                <div style={photoRowStyle}>
                  {entry.photoUrls.map((url) => <img key={url} alt="" src={url} style={photoStyle} />)}
                </div>
              ) : null}
              {entry.painScore !== null ? <span style={pillStyle}>통증 점수 {entry.painScore}</span> : null}
            </article>
          ))}
        </div>
      </article>}
    </section>
  );
}

async function uploadJournalPhotos(files: File[], coupleId: string | null) {
  if (!coupleId || files.length === 0) return [];
  const client = createFevioBrowserAuthClient();
  const safeFiles = files.slice(0, 6);
  const paths: string[] = [];
  for (const file of safeFiles) {
    const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/giu, '').toLowerCase() || 'jpg';
    const path = `${coupleId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from('couple-journal-photos').upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (!error) paths.push(path);
  }
  return paths;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '오늘';
  return parsed.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

const feedStyle = { background: 'rgba(255,255,255,0.82)', borderTop: '1px solid var(--slc-border)', borderBottom: '1px solid var(--slc-border)', padding: '18px 20px' } as const;
const lockedStyle = { margin: '0 16px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--slc-border)', padding: 20 } as const;
const feedHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 } as const;
const sectionEyebrowStyle = { display: 'inline-block', margin: '0 0 8px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const sectionTitleStyle = { color: 'var(--slc-text)', fontSize: 21, fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1.25, margin: 0 } as const;
const sectionBodyStyle = { color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0' } as const;
const formStyle = { display: 'grid', gap: 12, marginTop: 18 } as const;
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;
const labelStyle = { display: 'grid', gap: 7, color: 'var(--slc-text)', fontSize: 12, fontWeight: 900 } as const;
const textareaStyle = { minHeight: 74, border: '1px solid var(--slc-border)', borderRadius: 18, padding: 14, resize: 'vertical', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const inputStyle = { minHeight: 42, border: '1px solid var(--slc-border)', borderRadius: 16, padding: '0 12px', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const buttonStyle = { border: 0, borderRadius: 18, background: 'var(--fevio-coral)', color: '#fff', fontSize: 14, fontWeight: 950, minHeight: 46 } as const;
const listStyle = { display: 'grid', marginTop: 18 } as const;
const entryStyle = { background: 'rgba(255, 252, 250, 0.68)', borderTop: '1px solid var(--slc-border)', padding: '16px 0' } as const;
const entryMetaStyle = { color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850, marginBottom: 7 } as const;
const entryBodyStyle = { color: 'var(--slc-text)', fontSize: 14, fontWeight: 800, lineHeight: 1.45, margin: 0 } as const;
const pillStyle = { display: 'inline-block', marginTop: 9, borderRadius: 999, background: 'rgba(185, 128, 103, 0.11)', color: 'var(--fevio-coral)', padding: '6px 9px', fontSize: 11, fontWeight: 900 } as const;
const emptyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 } as const;
const inviteLinkStyle = { display: 'inline-flex', marginTop: 14, borderRadius: 999, background: 'var(--fevio-coral)', color: '#fff', textDecoration: 'none', padding: '11px 16px', fontSize: 13, fontWeight: 950 } as const;
const floatingButtonStyle = { width: 44, height: 44, borderRadius: 999, border: 0, background: 'var(--fevio-coral)', color: '#fff', fontSize: 24, fontWeight: 800, boxShadow: '0 12px 26px rgba(185, 97, 75, 0.24)' } as const;
const fileInputStyle = { font: 'inherit', fontSize: 12 } as const;
const thumbnailRowStyle = { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 } as const;
const thumbnailPillStyle = { flex: '0 0 auto', borderRadius: 999, border: '1px solid var(--slc-border)', padding: '7px 10px', color: 'var(--slc-muted)', fontSize: 11, fontWeight: 800 } as const;
const photoRowStyle = { display: 'flex', gap: 8, overflowX: 'auto', marginTop: 10 } as const;
const photoStyle = { flex: '0 0 108px', width: 108, height: 108, borderRadius: 18, objectFit: 'cover', border: '1px solid var(--slc-border)' } as const;
