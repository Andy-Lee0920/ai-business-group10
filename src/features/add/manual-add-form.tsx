'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker, type DateRange } from 'react-day-picker';
import type { CSSProperties } from 'react';
import type { ScheduleType, Medication } from '../../types/slc.types';
import {
  buildManualAddPayload,
  MANUAL_ADD_TYPE_CONFIG,
  manualAddConfigFor,
  type ManualAddFormValue,
  type ManualAddScheduleMode,
} from '../../domain/slc-manual-add';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';

type AddMedication = Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'aliases' | 'category' | 'route' | 'default_unit' | 'default_cta'>;

interface Props {
  medications: AddMedication[];
}

const MAX_RANGE_DAYS = 30;

function toDateInputValue(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysInclusive(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function emptyForm(type: ScheduleType): ManualAddFormValue {
  const config = manualAddConfigFor(type);
  return {
    type,
    title: '',
    dose: '',
    unit: config.defaultUnit,
    scheduledAt: '',
    medicationId: '',
    selectedCategory: null,
    scheduleMode: 'single',
    startDate: '',
    endDate: '',
    dailyTime: '',
  };
}

function categoryHint(category: Medication['category'] | null): string | null {
  if (category === 'stimulation') return '기간 반복 추천';
  if (category === 'trigger') return '단일 날짜 모드 유지';
  return null;
}

export function ManualAddForm({ medications }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [form, setForm] = useState<ManualAddFormValue>(() => emptyForm('injection'));

  const config = manualAddConfigFor(form.type);
  const isTrigger = form.selectedCategory === 'trigger';

  const matchingMedications = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('ko-KR');
    return medications
      .filter((medication) => config.routeFilter.length === 0 || config.routeFilter.includes(medication.route))
      .filter((medication) => {
        if (!normalized) return true;
        const searchable = [
          medication.brand_name_ko,
          medication.brand_name_en ?? '',
          ...medication.aliases,
        ].join(' ').toLocaleLowerCase('ko-KR');
        return searchable.includes(normalized);
      });
  }, [config.routeFilter, medications, searchTerm]);

  const selectType = (type: ScheduleType) => {
    setForm(emptyForm(type));
    setSearchTerm('');
    setRange(undefined);
  };

  const selectScheduleMode = (scheduleMode: ManualAddScheduleMode) => {
    if (scheduleMode === 'range' && isTrigger) return;
    setForm((current) => ({
      ...current,
      scheduleMode,
      scheduledAt: scheduleMode === 'range' ? '' : current.scheduledAt,
      startDate: scheduleMode === 'single' ? '' : current.startDate,
      endDate: scheduleMode === 'single' ? '' : current.endDate,
      dailyTime: scheduleMode === 'single' ? '' : current.dailyTime,
    }));
  };

  const selectMedication = (medication: AddMedication) => {
    const nextScheduleMode: ManualAddScheduleMode = medication.category === 'stimulation' ? 'range' : 'single';
    setForm((current) => ({
      ...current,
      medicationId: medication.id,
      title: medication.brand_name_ko,
      unit: medication.default_unit,
      selectedCategory: medication.category,
      scheduleMode: nextScheduleMode,
      scheduledAt: nextScheduleMode === 'range' ? '' : current.scheduledAt,
    }));
    setSearchTerm(medication.brand_name_ko);
  };

  const selectDirectInput = () => {
    setForm((current) => ({
      ...current,
      medicationId: '',
      title: searchTerm.trim() || current.title,
      selectedCategory: null,
      scheduleMode: 'single',
    }));
  };

  const selectRange = (nextRange: DateRange | undefined) => {
    if (!nextRange?.from) {
      setRange(nextRange);
      setForm((current) => ({ ...current, startDate: '', endDate: '' }));
      return;
    }

    const cappedTo = nextRange.to && daysInclusive(nextRange.from, nextRange.to) > MAX_RANGE_DAYS
      ? addDays(nextRange.from, MAX_RANGE_DAYS - 1)
      : nextRange.to;
    const cappedRange = { from: nextRange.from, to: cappedTo };

    setRange(cappedRange);
    setForm((current) => ({
      ...current,
      startDate: toDateInputValue(cappedRange.from),
      endDate: toDateInputValue(cappedRange.to ?? cappedRange.from),
    }));
  };

  const canSave = form.title.trim().length > 0 && (
    form.scheduleMode === 'single'
      ? form.scheduledAt.length > 0
      : form.startDate.length > 0 && form.endDate.length > 0 && form.dailyTime.length > 0
  );

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const payload = buildManualAddPayload({
      ...form,
      scheduledAt: form.scheduleMode === 'single' ? new Date(form.scheduledAt).toISOString() : '',
    });
    await fetch('/api/schedule/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    router.push('/home');
  };

  const inputStyle: CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid var(--slc-border)',
    fontSize: 16, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle: CSSProperties = {
    fontSize: 14, color: 'var(--slc-muted)', display: 'block', marginBottom: 8, marginTop: 16,
  };
  const selectedMedication = form.selectedCategory ? categoryHint(form.selectedCategory) : null;
  const showSearchEmpty = config.showMedicationSelect && searchTerm.trim().length > 0 && matchingMedications.length === 0;
  const ambientAsset = form.type === 'clinic' ? slcAssets.home.clinicWide : slcAssets.home.injectionWide;

  return (
    <AmbientStoryBackground asset={ambientAsset} intensity="subtle" style={{ minHeight: '100dvh', padding: 'var(--fevio-page-top) var(--fevio-page-gutter) var(--fevio-page-bottom)' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--slc-muted)', fontSize: 15, cursor: 'pointer', marginBottom: 20, fontFamily: 'inherit' }}>
        ← 뒤로
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--slc-text)', marginBottom: 24 }}>일정 추가</h1>

      <label style={labelStyle}>종류</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['injection', 'medication', 'clinic'] as const).map((t) => {
          return (
            <button key={t} onClick={() => selectType(t)} style={{
              padding: '9px 16px', borderRadius: 999,
              background: form.type === t ? 'var(--slc-coral)' : 'var(--slc-border)',
              color: form.type === t ? '#fff' : 'var(--slc-muted)',
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
          <input
            type="search"
            style={inputStyle}
            placeholder="약 이름을 검색하세요"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div style={{ display: 'grid', gap: 8, maxHeight: 230, overflowY: 'auto', paddingRight: 2 }}>
            {showSearchEmpty ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--slc-muted)', border: '1px dashed var(--slc-border)', borderRadius: 18, background: '#fff' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--slc-text)' }}>검색 결과가 없어요</p>
                <p style={{ margin: 0, fontSize: 12 }}>직접 입력으로 계속 추가할 수 있어요.</p>
              </div>
            ) : null}
            {matchingMedications.map((medication) => {
              const selected = form.medicationId === medication.id;
              const hint = categoryHint(medication.category);
              return (
                <button
                  key={medication.id}
                  type="button"
                  onClick={() => selectMedication(medication)}
                  style={{
                    ...inputStyle,
                    borderColor: selected ? 'var(--slc-coral)' : 'var(--slc-border)',
                    background: selected ? 'var(--slc-coral-light)' : '#fff',
                    color: selected ? 'var(--slc-coral)' : 'var(--slc-text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 800 }}>{medication.brand_name_ko}</span>
                  <span style={{ display: 'block', color: 'var(--slc-muted)', fontSize: 12, marginTop: 3 }}>
                    {[medication.brand_name_en, ...medication.aliases].filter(Boolean).join(' · ') || '등록된 별칭 없음'}
                  </span>
                  {hint && <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 8px', borderRadius: 999, background: '#F7F1EE', color: '#9B6B5E', fontSize: 12, fontWeight: 800 }}>{hint}</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={selectDirectInput}
              style={{
                ...inputStyle,
                borderStyle: 'dashed',
                color: '#6F625C',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              ✏️ 직접 입력
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--slc-muted)', margin: '2px 0 0' }}>{SLC_SAFE_COPY.medicationNotFound}</p>
        </div>
      )}
      <input
        style={{ ...inputStyle, marginTop: config.showMedicationSelect ? 8 : 0 }}
        placeholder={config.titlePlaceholder}
        value={form.title}
        onChange={(e) => setForm((current) => ({ ...current, title: e.target.value, medicationId: '', selectedCategory: null }))}
      />
      {selectedMedication && <p style={{ color: '#9B6B5E', fontSize: 12, fontWeight: 800, margin: '8px 0 0' }}>{selectedMedication}</p>}

      {config.showDose && (
        <>
          <label style={labelStyle}>{config.doseLabel}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 2 }}
              placeholder="150"
              value={form.dose}
              onChange={(e) => setForm((current) => ({ ...current, dose: e.target.value }))}
            />
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {config.unitOptions.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, unit: u }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: form.unit === u ? 'var(--slc-coral)' : 'var(--slc-border)',
                    color: form.unit === u ? '#fff' : 'var(--slc-muted)',
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['single', 'range'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => selectScheduleMode(mode)}
            disabled={mode === 'range' && isTrigger}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 999,
              border: 'none',
              background: form.scheduleMode === mode ? 'var(--slc-coral)' : 'var(--slc-border)',
              color: form.scheduleMode === mode ? '#fff' : 'var(--slc-muted)',
              fontSize: 13,
              fontWeight: 800,
              opacity: mode === 'range' && isTrigger ? 0.45 : 1,
              cursor: mode === 'range' && isTrigger ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {mode === 'single' ? '단일 날짜' : '기간 반복'}
          </button>
        ))}
      </div>

      {form.scheduleMode === 'range' ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ border: '1.5px solid var(--slc-border)', borderRadius: 18, padding: 10, background: '#fff' }}>
            <DayPicker
              mode="range"
              selected={range}
              onSelect={selectRange}
              styles={{
                root: { width: '100%', fontFamily: 'inherit', color: 'var(--slc-text)' },
                caption_label: { fontWeight: 800 },
                day: { borderRadius: 999 },
                selected: { backgroundColor: 'var(--slc-coral)', color: '#fff' },
                range_middle: { backgroundColor: 'var(--slc-coral-light)', color: 'var(--slc-coral)' },
                today: { color: 'var(--slc-coral)', fontWeight: 800 },
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--slc-muted)', margin: 0 }}>최대 30일까지 반복 일정을 만들 수 있어요.</p>
          <label style={{ ...labelStyle, marginTop: 2 }}>매일 이 시간에</label>
          <input
            type="time"
            style={inputStyle}
            value={form.dailyTime}
            onChange={(event) => setForm((current) => ({ ...current, dailyTime: event.target.value }))}
          />
        </div>
      ) : (
        <input
          type="datetime-local" style={inputStyle}
          value={form.scheduledAt}
          onChange={(e) => setForm((current) => ({ ...current, scheduledAt: e.target.value }))}
        />
      )}

      <button
        onClick={save}
        disabled={saving || !canSave}
        style={{
          marginTop: 32, background: 'var(--slc-coral)', color: '#fff', border: 'none', borderRadius: 999,
          padding: '14px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit',
          opacity: (saving || !canSave) ? 0.5 : 1,
        }}
      >
        {saving ? '저장 중...' : '일정 추가'}
      </button>
    </AmbientStoryBackground>
  );
}
