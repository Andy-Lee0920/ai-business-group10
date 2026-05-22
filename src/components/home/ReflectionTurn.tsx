'use client';
import { useEffect, useRef, useState } from 'react';

export function ReflectionTurn() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const openedAt = useRef<number | null>(null);

  useEffect(() => {
    if (open && openedAt.current === null) openedAt.current = Date.now();
  }, [open]);

  function close(submitted = sent) {
    const dwellMs = openedAt.current ? Date.now() - openedAt.current : 0;
    void fetch('/api/brief/reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opened: true, submitted, dwellMs }),
    });
    setOpen(false);
    setSent(false);
    openedAt.current = null;
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>오늘의 한 줄</button>;

  return (
    <section data-testid="reflection-turn" style={wrapStyle}>
      <label style={labelStyle} htmlFor="reflection-turn-input">오늘 남기고 싶은 한 줄</label>
      <textarea id="reflection-turn-input" rows={3} placeholder="쓰고 나면 저장하지 않고 비워요." style={textStyle} />
      <button type="button" onClick={() => { setSent(true); close(true); }} style={doneStyle}>닫기</button>
    </section>
  );
}

const triggerStyle = { border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255,255,255,0.72)', color: 'var(--slc-text)', padding: '11px 16px', fontWeight: 900, fontFamily: 'inherit' } as const;
const wrapStyle = { display: 'grid', gap: 8, padding: 14, borderRadius: 22, background: 'rgba(255,255,255,0.78)', border: '1px solid var(--slc-border)' } as const;
const labelStyle = { color: 'var(--slc-text)', fontSize: 13, fontWeight: 900 } as const;
const textStyle = { width: '100%', boxSizing: 'border-box', borderRadius: 16, border: '1px solid var(--slc-border)', padding: 12, fontFamily: 'inherit', resize: 'vertical' } as const;
const doneStyle = { justifySelf: 'end', border: 0, borderRadius: 999, background: 'var(--slc-coral-gradient)', color: '#fff', padding: '10px 18px', fontWeight: 900, fontFamily: 'inherit' } as const;
