'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import type { Medication } from '../../types/slc.types';

interface Props {
  medications: Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'default_unit' | 'default_cta'>[];
}

type Step = 'same_med' | 'new_med' | 'days' | 'next_visit' | 'trigger' | 'confirm';

interface FormState {
  sameMedication: boolean | null;
  addedMedicationIds: string[];
  medicationDays: number | null;
  nextVisitAt: string;
  triggerPlan: string;
  memo: string;
}

export function ClinicUpdateForm({ medications }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('same_med');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    sameMedication: null,
    addedMedicationIds: [],
    medicationDays: null,
    nextVisitAt: '',
    triggerPlan: '',
    memo: '',
  });

  const prefillNextVisit = (days: number) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setForm((f) => ({ ...f, medicationDays: days, nextVisitAt: `${yyyy}-${mm}-${dd}` }));
    setStep('next_visit');
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/clinic-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sameMedication: form.sameMedication ?? true,
        addedMedicationIds: form.addedMedicationIds,
        medicationDays: form.medicationDays,
        nextVisitAt: form.nextVisitAt ? new Date(form.nextVisitAt).toISOString() : null,
        triggerPlan: form.triggerPlan,
        memo: form.memo,
      }),
    });
    setSaving(false);
    router.push('/home');
  };

  const containerStyle: CSSProperties = {
    padding: '60px 24px 24px', minHeight: '100dvh', display: 'flex', flexDirection: 'column',
  };
  const titleStyle: CSSProperties = { fontSize: 22, fontWeight: 800, color: '#2A1F1A', marginBottom: 8 };
  const subtitleStyle: CSSProperties = { fontSize: 15, color: '#9B8E86', marginBottom: 32, lineHeight: 1.5 };
  const optionStyle = (active: boolean): CSSProperties => ({
    padding: '16px 20px', borderRadius: 16,
    border: `2px solid ${active ? '#C4614A' : '#F0EDE8'}`,
    background: active ? '#FFF0EB' : '#fff',
    cursor: 'pointer', fontSize: 16, fontWeight: 600,
    color: active ? '#C4614A' : '#2A1F1A',
    marginBottom: 10, display: 'block', width: '100%', textAlign: 'left', fontFamily: 'inherit',
  });
  const ctaStyle: CSSProperties = {
    marginTop: 16, background: '#C4614A', color: '#fff', border: 'none', borderRadius: 999,
    padding: '14px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit',
  };

  if (step === 'same_med') return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>같은 약을 계속 사용하나요?</h2>
      <p style={subtitleStyle}>병원에서 처방이 변경되었는지 확인해 주세요</p>
      <button style={optionStyle(false)} onClick={() => { setForm((f) => ({ ...f, sameMedication: true })); setStep('days'); }}>그대로예요</button>
      <button style={optionStyle(false)} onClick={() => { setForm((f) => ({ ...f, sameMedication: false })); setStep('new_med'); }}>변경됐어요</button>
      <button style={optionStyle(false)} onClick={() => { setForm((f) => ({ ...f, sameMedication: null })); setStep('days'); }}>잘 모르겠어요</button>
    </div>
  );

  if (step === 'new_med') return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>새 약을 처방받았나요?</h2>
      <p style={subtitleStyle}>해당하는 약을 선택해 주세요</p>
      {medications.map((med) => {
        const selected = form.addedMedicationIds.includes(med.id);
        return (
          <button key={med.id} style={optionStyle(selected)} onClick={() => setForm((f) => ({
            ...f,
            addedMedicationIds: selected
              ? f.addedMedicationIds.filter((id) => id !== med.id)
              : [...f.addedMedicationIds, med.id],
          }))}>
            {med.brand_name_ko}{med.brand_name_en ? ` (${med.brand_name_en})` : ''} · {med.default_unit}
          </button>
        );
      })}
      <button onClick={() => setStep('days')} style={ctaStyle}>다음</button>
    </div>
  );

  if (step === 'days') return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>몇 일치 처방받으셨나요?</h2>
      <p style={subtitleStyle}>처방 일수에 따라 다음 방문일이 자동 입력돼요</p>
      {[1, 2, 3].map((d) => (
        <button key={d} style={optionStyle(form.medicationDays === d)} onClick={() => prefillNextVisit(d)}>{d}일</button>
      ))}
      <label style={{ display: 'block', marginTop: 8 }}>
        <span style={{ fontSize: 14, color: '#9B8E86', display: 'block', marginBottom: 8 }}>직접 입력</span>
        <input
          type="number" min="1" max="30" placeholder="일 수 입력"
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #F0EDE8', fontSize: 16, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
          onChange={(e) => { const v = parseInt(e.target.value); if (v > 0) prefillNextVisit(v); }}
        />
      </label>
    </div>
  );

  if (step === 'next_visit') return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>다음 병원 방문일이 잡혔나요?</h2>
      <p style={subtitleStyle}>{form.medicationDays}일치라면 다음 방문은 {form.medicationDays}일 뒤인가요?</p>
      <label style={{ display: 'block', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#9B8E86', display: 'block', marginBottom: 8 }}>방문일 선택</span>
        <input
          type="date" value={form.nextVisitAt}
          onChange={(e) => setForm((f) => ({ ...f, nextVisitAt: e.target.value }))}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #F0EDE8', fontSize: 16, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
        />
      </label>
      <button onClick={() => setStep('trigger')} style={ctaStyle}>다음</button>
      <button
        onClick={() => { setForm((f) => ({ ...f, nextVisitAt: '' })); setStep('trigger'); }}
        style={{ background: 'transparent', color: '#9B8E86', border: 'none', padding: '12px 0', fontSize: 14, cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: 4 }}
      >아직 몰라요</button>
    </div>
  );

  if (step === 'trigger') return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>트리거 주사 일정이 있나요?</h2>
      {(['today', 'tomorrow', 'not_yet', 'unknown'] as const).map((v) => {
        const labels: Record<string, string> = { today: '오늘', tomorrow: '내일', not_yet: '아직', unknown: '모르겠어요' };
        return (
          <button key={v} style={optionStyle(form.triggerPlan === v)} onClick={() => { setForm((f) => ({ ...f, triggerPlan: v })); setStep('confirm'); }}>
            {labels[v]}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>변경 내용을 확인해 주세요</h2>
      <div style={{ background: '#fff', borderRadius: 18, padding: '20px', border: '1.5px solid #F0EDE8', marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#9B8E86' }}>같은 약 유지: <strong style={{ color: '#2A1F1A' }}>{form.sameMedication === true ? '예' : form.sameMedication === false ? '아니요' : '모름'}</strong></p>
        {form.addedMedicationIds.length > 0 && (
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#9B8E86' }}>추가된 약: <strong style={{ color: '#2A1F1A' }}>{form.addedMedicationIds.join(', ')}</strong></p>
        )}
        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#9B8E86' }}>처방 일수: <strong style={{ color: '#2A1F1A' }}>{form.medicationDays ?? '-'}일</strong></p>
        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#9B8E86' }}>다음 방문: <strong style={{ color: '#2A1F1A' }}>{form.nextVisitAt || '미정'}</strong></p>
      </div>
      <label style={{ display: 'block', marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: '#9B8E86', display: 'block', marginBottom: 8 }}>메모 (선택)</span>
        <textarea
          value={form.memo}
          onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
          placeholder="병원에서 들은 내용을 간단히 적어두세요"
          rows={3}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #F0EDE8', fontSize: 15, fontFamily: 'inherit', background: '#fff', resize: 'none', boxSizing: 'border-box' }}
        />
      </label>
      <button onClick={save} disabled={saving} style={{ ...ctaStyle, opacity: saving ? 0.7 : 1 }}>
        {saving ? '저장 중...' : '변경 저장'}
      </button>
    </div>
  );
}
