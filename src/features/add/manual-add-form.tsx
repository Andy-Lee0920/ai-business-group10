'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import type { ScheduleType, Medication } from '../../types/slc.types';

interface Props {
  medications: Pick<Medication, 'id' | 'brand_name_ko' | 'default_unit' | 'default_cta'>[];
}

export function ManualAddForm({ medications }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'injection' as ScheduleType,
    title: '',
    dose: '',
    unit: 'IU',
    scheduledAt: '',
    medicationId: '',
  });

  const save = async () => {
    if (!form.title || !form.scheduledAt) return;
    setSaving(true);
    await fetch('/api/schedule/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
    });
    setSaving(false);
    router.push('/home');
  };

  const inputStyle: CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid #F0EDE8',
    fontSize: 16, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle: CSSProperties = {
    fontSize: 14, color: '#9B8E86', display: 'block', marginBottom: 8, marginTop: 16,
  };

  return (
    <div style={{ padding: '60px 24px 24px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9B8E86', fontSize: 15, cursor: 'pointer', marginBottom: 20, fontFamily: 'inherit' }}>
        ← 뒤로
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 24 }}>일정 추가</h1>

      <label style={labelStyle}>종류</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['injection', 'medication', 'clinic'] as const).map((t) => {
          const labels: Record<ScheduleType, string> = { injection: '주사', medication: '복용약', clinic: '병원' };
          return (
            <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))} style={{
              padding: '9px 16px', borderRadius: 999,
              background: form.type === t ? '#C4614A' : '#F0EDE8',
              color: form.type === t ? '#fff' : '#9B8E86',
              border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      <label style={labelStyle}>약명 또는 일정명</label>
      <select
        style={inputStyle}
        value={form.medicationId}
        onChange={(e) => {
          const med = medications.find((m) => m.id === e.target.value);
          setForm((f) => ({
            ...f,
            medicationId: e.target.value,
            title: med ? med.brand_name_ko : f.title,
            unit: med ? med.default_unit : f.unit,
          }));
        }}
      >
        <option value="">직접 입력</option>
        {medications.map((m) => <option key={m.id} value={m.id}>{m.brand_name_ko}</option>)}
      </select>
      <input
        style={{ ...inputStyle, marginTop: 8 }}
        placeholder="약명 또는 일정명"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      {form.type !== 'clinic' && (
        <>
          <label style={labelStyle}>용량 (선택)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 2 }}
              placeholder="150"
              value={form.dose}
              onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
            />
            <select style={{ ...inputStyle, flex: 1 }} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              {['IU', 'mg', 'μg', 'ml', '정', '개', 'syringe'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </>
      )}

      <label style={labelStyle}>날짜 · 시간</label>
      <input
        type="datetime-local" style={inputStyle}
        value={form.scheduledAt}
        onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
      />

      <button
        onClick={save}
        disabled={saving || !form.title || !form.scheduledAt}
        style={{
          marginTop: 32, background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999,
          padding: '14px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit',
          opacity: (saving || !form.title || !form.scheduledAt) ? 0.5 : 1,
        }}
      >
        {saving ? '저장 중...' : '일정 추가'}
      </button>
    </div>
  );
}
