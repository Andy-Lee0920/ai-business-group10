'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ScheduleItem, ScheduleType } from '../../types/slc.types';

interface ScheduleEditFormProps {
  readonly item: ScheduleItem;
}

const TYPE_OPTIONS: Array<{ value: ScheduleType; label: string }> = [
  { value: 'injection', label: '주사' },
  { value: 'medication', label: '복용' },
  { value: 'clinic', label: '병원 방문' },
];

export function ScheduleEditForm({ item }: ScheduleEditFormProps) {
  const router = useRouter();
  const [type, setType] = useState<ScheduleType>(item.type);
  const [title, setTitle] = useState(item.title);
  const [scheduledAt, setScheduledAt] = useState(() => toDateTimeLocal(item.scheduled_at));
  const [dose, setDose] = useState(item.dose ?? '');
  const [unit, setUnit] = useState(item.unit ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedule/${item.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          dose,
          unit,
          medicationId: item.medication_id,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? '일정을 저장하지 못했어요.');
      router.push('/home');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '일정을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: '100dvh', padding: '54px 20px 112px', background: 'var(--slc-bg)' }}>
      <Link href="/home" style={backLinkStyle}>‹ 홈으로</Link>
      <header style={{ margin: '18px 0 20px' }}>
        <p style={{ margin: '0 0 5px', color: 'var(--slc-coral)', fontSize: 12, fontWeight: 900 }}>일정 수정</p>
        <h1 style={{ margin: 0, color: 'var(--slc-text)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em' }}>등록한 내용을 고칠게요</h1>
        <p style={{ margin: '9px 0 0', color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.5 }}>병원 안내와 다르게 저장된 이름, 시간, 용량만 직접 수정해 주세요.</p>
      </header>

      <form data-testid="schedule-edit-form" onSubmit={onSubmit} style={formStyle}>
        <label style={labelStyle}>
          종류
          <select value={type} onChange={(event) => setType(event.currentTarget.value as ScheduleType)} style={fieldStyle}>
            {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          이름
          <input value={title} onChange={(event) => setTitle(event.currentTarget.value)} style={fieldStyle} required maxLength={80} />
        </label>
        <label style={labelStyle}>
          시간
          <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.currentTarget.value)} style={fieldStyle} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={labelStyle}>
            용량
            <input value={dose} onChange={(event) => setDose(event.currentTarget.value)} style={fieldStyle} placeholder="예: 150" />
          </label>
          <label style={labelStyle}>
            단위
            <input value={unit} onChange={(event) => setUnit(event.currentTarget.value)} style={fieldStyle} placeholder="예: IU" />
          </label>
        </div>
        {error ? <p role="alert" style={{ margin: 0, color: 'var(--slc-coral)', fontSize: 13, fontWeight: 800 }}>{error}</p> : null}
        <button type="submit" disabled={saving} style={submitStyle(saving)}>{saving ? '저장 중' : '수정 저장'}</button>
      </form>
    </main>
  );
}

function toDateTimeLocal(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const backLinkStyle = {
  color: 'var(--slc-muted)',
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
} as const;

const formStyle = {
  display: 'grid',
  gap: 12,
  padding: 18,
  borderRadius: 24,
  background: 'var(--slc-surface)',
  border: '1px solid var(--slc-border)',
} as const;

const labelStyle = {
  display: 'grid',
  gap: 6,
  color: 'var(--slc-muted)',
  fontSize: 12,
  fontWeight: 900,
} as const;

const fieldStyle = {
  minHeight: 46,
  borderRadius: 15,
  border: '1px solid var(--slc-border)',
  background: 'var(--slc-bg)',
  color: 'var(--slc-text)',
  padding: '0 13px',
  fontSize: 15,
  fontWeight: 800,
  fontFamily: 'inherit',
} as const;

function submitStyle(saving: boolean) {
  return {
    minHeight: 50,
    border: 0,
    borderRadius: 999,
    background: 'var(--slc-coral)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 900,
    fontFamily: 'inherit',
    cursor: saving ? 'wait' : 'pointer',
    opacity: saving ? 0.72 : 1,
  } as const;
}
