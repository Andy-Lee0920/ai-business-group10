'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import type { ScheduleType, Medication } from '../../types/slc.types';
import { buildManualAddPayload, MANUAL_ADD_TYPE_CONFIG, manualAddConfigFor } from '../../domain/slc-manual-add';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';

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

  const config = manualAddConfigFor(form.type);

  const selectType = (type: ScheduleType) => {
    const nextConfig = manualAddConfigFor(type);
    setForm((f) => ({
      ...f,
      type,
      title: '',
      dose: '',
      unit: nextConfig.defaultUnit,
      medicationId: '',
    }));
  };

  const save = async () => {
    if (!form.title || !form.scheduledAt) return;
    setSaving(true);
    await fetch('/api/schedule/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildManualAddPayload({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() })),
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
          return (
            <button key={t} onClick={() => selectType(t)} style={{
              padding: '9px 16px', borderRadius: 999,
              background: form.type === t ? '#C4614A' : '#F0EDE8',
              color: form.type === t ? '#fff' : '#9B8E86',
              border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {MANUAL_ADD_TYPE_CONFIG[t].label}
            </button>
          );
        })}
      </div>

      <label style={labelStyle}>{config.titleLabel}</label>
      {config.showMedicationSelect && (
        <div style={{ display: 'grid', gap: 8 }}>
          {medications.map((m) => {
            const selected = form.medicationId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  medicationId: m.id,
                  title: m.brand_name_ko,
                  unit: m.default_unit,
                }))}
                style={{
                  ...inputStyle,
                  borderColor: selected ? '#C4614A' : '#F0EDE8',
                  background: selected ? '#FFF0EB' : '#fff',
                  color: selected ? '#C4614A' : '#2A1F1A',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {m.brand_name_ko}
              </button>
            );
          })}
          <p style={{ fontSize: 12, color: '#9B8E86', margin: '2px 0 0' }}>{SLC_SAFE_COPY.medicationNotFound}</p>
        </div>
      )}
      <input
        style={{ ...inputStyle, marginTop: config.showMedicationSelect ? 8 : 0 }}
        placeholder={config.titlePlaceholder}
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      {config.showDose && (
        <>
          <label style={labelStyle}>{config.doseLabel}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 2 }}
              placeholder="150"
              value={form.dose}
              onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
            />
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {config.unitOptions.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, unit: u }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: form.unit === u ? '#C4614A' : '#F0EDE8',
                    color: form.unit === u ? '#fff' : '#9B8E86',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <label style={labelStyle}>{config.timeLabel}</label>
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
