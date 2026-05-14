'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import type { Medication } from '../../types/slc.types';
import type { ClinicGuideMedicationNormalizeResponse } from '../../types/clinic-guide.types';
import { resolveMedicationNames } from '../../domain/clinic-guide-medication-normalizer';
import { buildClinicUpdateScheduleItems, prefillNextVisitDate } from '../../domain/slc-clinic-update';

type MedicationOption = Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'aliases' | 'default_unit' | 'default_cta'>;

type Step = 'entry' | 'same_med' | 'new_med' | 'days' | 'memo' | 'confirm' | 'success';
type NewMedicationIntent = 'yes' | 'no' | null;
type SavedScheduleItem = { title: string; scheduledAt: string; unit: string | null };
type ClinicUpdateSaveScheduleItem = { title: string; scheduledAt?: string; scheduled_at?: string; unit: string | null };
type ClinicUpdateSaveResponse = { ok?: boolean; scheduleItems?: ClinicUpdateSaveScheduleItem[] };

interface Props {
  medications: MedicationOption[];
  partnerConnected?: boolean;
}

interface FormState {
  sameMedication: boolean | null;
  addedMedicationIds: string[];
  medicationDays: number | null;
  nextVisitAt: string;
  triggerPlan: string;
  memo: string;
  directMedicationTitle: string;
  medicationSearch: string;
  newMedicationIntent: NewMedicationIntent;
  customDays: string;
}

const DIRECT_PREFIX = 'direct:';
const PROGRESS_TOTAL = 6;
const REFERENCE_PROGRESS_LABELS = ['01/06', '02/06', '03/06', '04/06', '05/06', '06/06'] as const;

export function ClinicUpdateForm({ medications, partnerConnected = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('entry');
  const [saving, setSaving] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [normalizedMedication, setNormalizedMedication] = useState<Medication | null>(null);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savedScheduleItems, setSavedScheduleItems] = useState<SavedScheduleItem[]>([]);
  const [form, setForm] = useState<FormState>({
    sameMedication: null,
    addedMedicationIds: [],
    medicationDays: null,
    nextVisitAt: '',
    triggerPlan: '',
    memo: '',
    directMedicationTitle: '',
    medicationSearch: '',
    newMedicationIntent: null,
    customDays: '',
  });

  const medicationOptions = useMemo(
    () => normalizedMedication && medications.every((medication) => medication.id !== normalizedMedication.id)
      ? [...medications, normalizedMedication]
      : medications,
    [medications, normalizedMedication],
  );

  const filteredMedications = useMemo(() => {
    const query = normalizeSearch(form.medicationSearch);
    if (!query) return medicationOptions;
    return medicationOptions.filter((medication) => [medication.brand_name_ko, medication.brand_name_en, ...medication.aliases]
      .filter((value): value is string => Boolean(value))
      .some((value) => normalizeSearch(value).includes(query)));
  }, [form.medicationSearch, medicationOptions]);

  const selectedMedicationNames = resolveSelectedMedicationNames(medicationOptions, form.addedMedicationIds, form.directMedicationTitle);
  const nextVisitPreview = form.nextVisitAt ? formatKoreanVisitDate(form.nextVisitAt) : '미정';
  const progress = progressForStep(step);

  useEffect(() => {
    if (step !== 'new_med' || form.newMedicationIntent !== 'yes') return;
    const userInput = form.medicationSearch.trim() || form.directMedicationTitle.trim();
    if (userInput.length < 2) {
      setNormalizedMedication(null);
      setNormalizing(false);
      return;
    }

    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      setNormalizing(true);
      const response = await fetch('/api/clinic-guide/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput }),
        signal: abortController.signal,
      }).catch(() => null);
      if (!response?.ok) {
        setNormalizing(false);
        return;
      }
      const payload = await response.json() as ClinicGuideMedicationNormalizeResponse;
      setNormalizedMedication(payload.matched);
      setNormalizing(false);
    }, 350);

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [form.directMedicationTitle, form.medicationSearch, form.newMedicationIntent, step]);

  useEffect(() => {
    if (step !== 'success') return;
    const timer = window.setTimeout(() => router.push('/home'), 3000);
    return () => window.clearTimeout(timer);
  }, [router, step]);

  const setMedicationId = (medicationId: string) => {
    setForm((current) => ({
      ...current,
      addedMedicationIds: current.addedMedicationIds.includes(medicationId)
        ? current.addedMedicationIds.filter((id) => id !== medicationId)
        : [...current.addedMedicationIds, medicationId],
    }));
  };

  const addDirectMedication = () => {
    const title = form.directMedicationTitle.trim() || form.medicationSearch.trim();
    if (!title) {
      setShowDirectInput(true);
      return;
    }
    const directId = `${DIRECT_PREFIX}${title}`;
    setForm((current) => ({
      ...current,
      directMedicationTitle: title,
      addedMedicationIds: current.addedMedicationIds.includes(directId) ? current.addedMedicationIds : [...current.addedMedicationIds, directId],
    }));
    setShowDirectInput(true);
  };

  const chooseDays = (days: number) => {
    setForm((current) => ({ ...current, medicationDays: days, customDays: String(days) }));
    setShowDatePicker(false);
  };

  const acceptVisitSuggestion = () => {
    if (!form.medicationDays) return;
    setForm((current) => ({ ...current, nextVisitAt: prefillNextVisitDate(form.medicationDays ?? 1) }));
    setShowDatePicker(false);
  };

  const save = async () => {
    setSaving(true);
    const selectedMedications = medicationOptions
      .filter((medication) => form.addedMedicationIds.includes(medication.id))
      .map((medication) => ({ id: medication.id, title: medication.brand_name_ko, unit: medication.default_unit }));
    const directMedication = directMedicationForSave(form);
    const scheduleItems = buildClinicUpdateScheduleItems({
      nextVisitAt: form.nextVisitAt,
      addedMedications: [...selectedMedications, ...directMedication],
    });

    const response = await fetch('/api/clinic-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sameMedication: form.sameMedication ?? true,
        addedMedicationIds: form.addedMedicationIds.filter((id) => !id.startsWith(DIRECT_PREFIX)),
        medicationDays: form.medicationDays,
        nextVisitAt: form.nextVisitAt ? new Date(form.nextVisitAt).toISOString() : null,
        triggerPlan: form.triggerPlan,
        memo: form.memo,
        newScheduleItems: scheduleItems,
      }),
    });
    const payload = await response.json().catch(() => ({})) as ClinicUpdateSaveResponse;
    const persistedScheduleItems = payload.scheduleItems?.length ? payload.scheduleItems : scheduleItems;
    setSavedScheduleItems(persistedScheduleItems.map(normalizeSavedScheduleItem));
    setSaving(false);
    setStep('success');
  };

  if (step === 'entry') return (
    <Shell header={<GuideHeader current={progress.current} total={progress.total} />}>
      <div style={{ flex: 1, display: 'grid', alignContent: 'center', gap: 22 }}>
        <p style={badgeStyle}>✦ Clinic Guide AI</p>
        <h1 style={heroTitleStyle}>오늘 병원 업데이트</h1>
        <p style={subtitleStyle}>몇 가지만 확인하면 오늘 일정에 반영할 수 있어요.</p>
        <div style={landingCardStyle} aria-label="병원 업데이트 안내">
          <div style={hospitalIconStyle}>🏥</div>
          <strong style={{ fontSize: 20 }}>오늘 병원<br />업데이트가 필요해요</strong>
        </div>
        <p style={safeNoteStyle}>ⓘ 챗봇이 아니라 질문 카드로 진행돼요</p>
      </div>
      <button type="button" onClick={() => setStep('same_med')} style={ctaStyle}>시작하기</button>
      <button type="button" onClick={() => router.push('/home')} style={textButtonStyle}>나중에 할게요</button>
    </Shell>
  );

  if (step === 'same_med') return (
    <Shell header={<GuideHeader current={progress.current} total={progress.total} />}>
      <QuestionCard icon="❔" title="같은 약을 계속 사용하나요?" lead="병원에서 오늘 들은 내용만 떠올려도 괜찮아요.">
        {[
          { label: '그대로', icon: '✓', value: true },
          { label: '바뀌었어요', icon: '💊', value: false },
          { label: '잘 모르겠어요', icon: '?', value: null },
        ].map((option) => (
          <button key={option.label} type="button" style={optionStyle(form.sameMedication === option.value)} onClick={() => setForm((current) => ({ ...current, sameMedication: option.value }))}>
            <span style={iconPillStyle}>{option.icon}</span>{option.label}
          </button>
        ))}
      </QuestionCard>
      <p style={safeNoteStyle}>ⓘ 선택에 따라 다음 질문이 달라져요</p>
      <button type="button" onClick={() => setStep(form.sameMedication === false ? 'new_med' : 'days')} style={ctaStyle}>다음</button>
    </Shell>
  );

  if (step === 'new_med') return (
    <Shell header={<GuideHeader current={progress.current} total={progress.total} />}>
      <QuestionCard title="새로 받은 약이 있나요?" lead="목록에서 찾거나, 없으면 직접 입력할 수 있어요.">
        <div style={chipRowStyle}>
          {(['yes', 'no'] as const).map((intent) => (
            <button key={intent} type="button" style={chipStyle(form.newMedicationIntent === intent)} onClick={() => setForm((current) => ({ ...current, newMedicationIntent: intent }))}>{intent === 'yes' ? '네' : '아니요'}</button>
          ))}
        </div>
      </QuestionCard>

      {form.newMedicationIntent === 'yes' && (
        <section style={panelStyle}>
          <input
            aria-label="약 이름 검색"
            value={form.medicationSearch}
            onChange={(event) => setForm((current) => ({ ...current, medicationSearch: event.target.value }))}
            placeholder="약 이름을 검색하세요"
            style={inputStyle}
          />
          <div style={listStyle}>
            {filteredMedications.map((medication) => (
              <button key={medication.id} type="button" style={rowStyle(form.addedMedicationIds.includes(medication.id))} onClick={() => setMedicationId(medication.id)}>
                <span style={iconPillStyle}>💊</span>
                <span><strong>{medication.brand_name_ko}</strong><small>{medication.brand_name_en}</small></span>
              </button>
            ))}
            <button type="button" style={rowStyle(showDirectInput)} onClick={addDirectMedication}>
              <span style={iconPillStyle}>✏️</span><strong>직접 입력</strong>
            </button>
          </div>
          {showDirectInput && (
            <input
              aria-label="직접 입력 약 이름"
              value={form.directMedicationTitle}
              onChange={(event) => setForm((current) => ({ ...current, directMedicationTitle: event.target.value }))}
              onBlur={addDirectMedication}
              placeholder="목록에 없는 약 이름"
              style={{ ...inputStyle, marginTop: 10 }}
            />
          )}
          {normalizing ? <p style={safeNoteStyle}>이름 보정은 뒤에서 처리 중이에요</p> : null}
          {normalizedMedication ? (
            <button type="button" style={rowStyle(form.addedMedicationIds.includes(normalizedMedication.id))} onClick={() => setMedicationId(normalizedMedication.id)}>
              <span style={iconPillStyle}>✦</span><span><small>정규화된 약 후보</small><strong>{normalizedMedication.brand_name_ko}</strong></span>
            </button>
          ) : null}
        </section>
      )}

      <button type="button" onClick={() => setStep('days')} style={ctaStyle}>약 선택 완료</button>
    </Shell>
  );

  if (step === 'days') return (
    <Shell header={<GuideHeader current={progress.current} total={progress.total} />}>
      <QuestionCard icon="💊" title="며칠치 처방받았나요?" lead="선택하면 다음 방문일 제안만 먼저 만들어요.">
        <div style={chipRowStyle}>
          {[1, 2, 3].map((days) => <button key={days} type="button" style={chipStyle(form.medicationDays === days)} onClick={() => chooseDays(days)}>{days}일</button>)}
          <button type="button" style={chipStyle(showDatePicker && ![1, 2, 3].includes(form.medicationDays ?? 0))} onClick={() => { setShowDatePicker(true); setForm((current) => ({ ...current, medicationDays: null })); }}>직접 입력</button>
        </div>
        {showDatePicker && !form.medicationDays ? (
          <input
            aria-label="처방 일수 직접 입력"
            type="number"
            min="1"
            max="30"
            value={form.customDays}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              setForm((current) => ({ ...current, customDays: event.target.value, medicationDays: Number.isFinite(value) && value > 0 ? value : null }));
            }}
            placeholder="일 수 입력"
            style={inputStyle}
          />
        ) : null}
      </QuestionCard>

      {form.medicationDays ? (
        <section style={suggestionCardStyle} aria-label="다음 방문일 제안">
          <div style={hospitalIconStyle}>📅</div>
          <h2 style={sectionTitleStyle}>다음 방문일 제안</h2>
          <p>{form.medicationDays}일치로 입력하셨어요. 다음 방문일을 {form.medicationDays}일 뒤로 표시할까요?</p>
          <div style={chipRowStyle}>
            <button type="button" style={{ ...chipStyle(true), flex: 1 }} onClick={acceptVisitSuggestion}>네, 표시할게요</button>
            <button type="button" style={{ ...chipStyle(false), flex: 1 }} onClick={() => setShowDatePicker(true)}>날짜 수정</button>
          </div>
          {showDatePicker ? <input aria-label="다음 방문일 수정" type="date" value={form.nextVisitAt} onChange={(event) => setForm((current) => ({ ...current, nextVisitAt: event.target.value }))} style={inputStyle} /> : null}
          <p style={previewRowStyle}>📅 다음 방문: {nextVisitPreview}</p>
        </section>
      ) : null}

      <button type="button" onClick={() => setStep('memo')} style={ctaStyle}>다음</button>
    </Shell>
  );

  if (step === 'memo') return (
    <Shell header={<GuideHeader current={progress.current} total={progress.total} />}>
      <h1 style={titleStyle}>추가로 남길 내용이 있나요?</h1>
      <p style={subtitleStyle}>필요한 경우에만 메모를 남겨주세요.</p>
      <label style={{ position: 'relative', display: 'block' }}>
        <textarea
          value={form.memo}
          maxLength={300}
          onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
          placeholder="트리거는 내일 오후 예정이라고 들었어요"
          rows={5}
          style={textareaStyle}
        />
        <span style={counterStyle}>{form.memo.length}/300</span>
      </label>
      <DraftPanel medicationNames={selectedMedicationNames} nextVisit={nextVisitPreview} memo={form.memo} />
      <p style={warningStyle}>⚠ 불명확한 시간은 저장 전에 다시 확인해요</p>
      <button type="button" onClick={() => setStep('confirm')} style={ctaStyle}>저장 전 확인</button>
      <p style={safeNoteStyle}>🔒 언제든 수정할 수 있어요</p>
    </Shell>
  );

  if (step === 'success') return (
    <Shell>
      <p style={successBannerStyle}>✓ 오늘 일정에 반영했어요</p>
      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>오늘 일정 미리보기</h2>
        {(savedScheduleItems.length ? savedScheduleItems : previewScheduleItems(selectedMedicationNames, form.nextVisitAt)).map((item) => (
          <button key={`${item.title}-${item.scheduledAt}`} type="button" style={rowStyle(false)} onClick={() => router.push('/home')}>
            <span style={timeChipStyle}>{formatTime(item.scheduledAt)}</span><strong>{item.title}</strong><small>추가됨 / 예정 ›</small>
          </button>
        ))}
        {partnerConnected ? <button type="button" style={rowStyle(false)}><span style={iconPillStyle}>👥</span><strong>파트너 공유 상태</strong><small>파트너가 읽기 전용으로 확인 중</small></button> : null}
      </section>
      <button type="button" onClick={() => router.push('/home')} style={ctaStyle}>홈으로 이동</button>
    </Shell>
  );

  return (
    <Shell header={<GuideHeader current={progress.current} total={progress.total} />}>
      <h1 style={titleStyle}>저장 전 확인해주세요</h1>
      <p style={subtitleStyle}>아래 내용을 확인한 후 저장하면 오늘 일정에 즉시 반영돼요.</p>
      <SummaryCard icon="📅" label="추가된 일정" value={selectedMedicationNames.length ? `${selectedMedicationNames.join(', ')} 오늘 19:00` : '추가된 약 없음'} onClick={() => setStep('new_med')} />
      <SummaryCard icon="🕐" label="다음 방문" value={nextVisitPreview} onClick={() => setStep('days')} />
      <SummaryCard icon="📄" label="메모" value={form.memo || '없음'} onClick={() => setStep('memo')} />
      <button type="button" onClick={save} disabled={saving} style={{ ...ctaStyle, opacity: saving ? 0.7 : 1 }}>{saving ? '저장 중...' : '저장하고 업데이트'}</button>
    </Shell>
  );
}

function GuideHeader({ current, total }: { current: number; total: number }) {
  const label = REFERENCE_PROGRESS_LABELS[current - 1] ?? `${String(current).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  return (
    <header style={{ display: 'grid', gap: 12, justifyItems: 'center', marginBottom: 18 }}>
      <strong style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500 }}>Fevio</strong>
      <span style={badgeStyle}>✦ Clinic Guide AI</span>
      <span style={{ color: '#C4614A', fontWeight: 900 }}>{label}</span>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} style={progressTrackStyle}>
        <i style={{ ...progressFillStyle, width: `${(current / total) * 100}%` }} />
      </div>
    </header>
  );
}

function Shell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return <main style={containerStyle}>{header}{children}</main>;
}

function QuestionCard({ icon, title, lead, children }: { icon?: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section style={questionCardStyle}>
      {icon ? <div style={hospitalIconStyle}>{icon}</div> : null}
      <h1 style={titleStyle}>{title}</h1>
      <p style={subtitleStyle}>{lead}</p>
      {children}
    </section>
  );
}

function DraftPanel({ medicationNames, nextVisit, memo }: { medicationNames: string[]; nextVisit: string; memo: string }) {
  return (
    <section style={panelStyle} aria-label="정리된 내용">
      <h2 style={{ ...sectionTitleStyle, color: '#C4614A' }}>정리된 내용</h2>
      <p>• 새 약: {medicationNames.length ? medicationNames.join(', ') : '없음'}</p>
      <p>• 다음 방문: {nextVisit}</p>
      <p>• 메모: {memo || '없음'}</p>
    </section>
  );
}

function SummaryCard({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={summaryCardStyle}>
      <span style={iconPillStyle}>{icon}</span>
      <span style={{ display: 'grid', gap: 4 }}><small>{label}</small><strong>{value}</strong></span>
      <span style={{ marginLeft: 'auto' }}>›</span>
    </button>
  );
}

function progressForStep(step: Step) {
  const map: Record<Step, number> = { entry: 1, same_med: 2, new_med: 3, days: 4, memo: 5, confirm: 6, success: 6 };
  return { current: map[step], total: PROGRESS_TOTAL };
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s\-_()]/gu, '');
}

function resolveSelectedMedicationNames(medications: Pick<Medication, 'id' | 'brand_name_ko'>[], ids: string[], directTitle: string) {
  const directIds = ids.filter((id) => id.startsWith(DIRECT_PREFIX)).map((id) => id.slice(DIRECT_PREFIX.length));
  return [...resolveMedicationNames(medications, ids.filter((id) => !id.startsWith(DIRECT_PREFIX))), ...directIds].filter((name) => name || directTitle);
}

function directMedicationForSave(form: FormState) {
  const directTitle = form.addedMedicationIds.find((id) => id.startsWith(DIRECT_PREFIX))?.slice(DIRECT_PREFIX.length) ?? '';
  const title = directTitle || form.directMedicationTitle.trim();
  return title ? [{ id: null, title, unit: null }] : [];
}

function normalizeSavedScheduleItem(item: ClinicUpdateSaveScheduleItem): SavedScheduleItem {
  return { title: item.title, scheduledAt: item.scheduledAt ?? item.scheduled_at ?? new Date().toISOString(), unit: item.unit };
}

function previewScheduleItems(names: string[], nextVisitAt: string) {
  const visitAt = nextVisitAt ? `${nextVisitAt}T09:00:00.000` : new Date().toISOString();
  return names.length
    ? names.map((title) => ({ title, scheduledAt: visitAt, unit: null }))
    : [{ title: '다음 병원 방문', scheduledAt: visitAt, unit: null }];
}

function formatKoreanVisitDate(value: string) {
  const date = new Date(`${value}T10:00:00`);
  if (Number.isNaN(date.getTime())) return '미정';
  return `${date.getMonth() + 1}월 ${date.getDate()}일 오전 10:00`;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '09:00';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const containerStyle: CSSProperties = { padding: '54px 24px 112px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #FFFCF7 0%, #F8F1E9 100%)', color: '#2A1F1A' };
const heroTitleStyle: CSSProperties = { margin: 0, textAlign: 'center', fontSize: 34, fontWeight: 900, letterSpacing: '-0.06em' };
const titleStyle: CSSProperties = { margin: '0 0 8px', textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.25 };
const sectionTitleStyle: CSSProperties = { margin: '0 0 8px', fontSize: 16, fontWeight: 900 };
const subtitleStyle: CSSProperties = { margin: '0 0 18px', textAlign: 'center', fontSize: 15, color: '#74675F', lineHeight: 1.55 };
const badgeStyle: CSSProperties = { justifySelf: 'center', width: 'fit-content', padding: '8px 14px', borderRadius: 999, background: '#FCE9E3', color: '#C4614A', fontSize: 14, fontWeight: 900 };
const landingCardStyle: CSSProperties = { display: 'grid', gap: 14, justifyItems: 'center', padding: 28, border: '1px solid #F0E1D6', borderRadius: 24, background: 'rgba(255,255,255,0.82)', boxShadow: '0 18px 40px rgba(82,57,45,0.10)', textAlign: 'center' };
const hospitalIconStyle: CSSProperties = { display: 'grid', placeItems: 'center', width: 58, height: 58, borderRadius: 999, background: '#FCE9E3', color: '#C4614A', fontSize: 28, margin: '0 auto 8px' };
const questionCardStyle: CSSProperties = { padding: 20, border: '1px solid #F0E1D6', borderRadius: 24, background: 'rgba(255,255,255,0.88)', boxShadow: '0 12px 28px rgba(82,57,45,0.08)' };
const panelStyle: CSSProperties = { marginTop: 16, padding: 16, border: '1px solid #F0E1D6', borderRadius: 18, background: 'rgba(255,255,255,0.78)' };
const suggestionCardStyle: CSSProperties = { ...panelStyle, textAlign: 'center', animation: 'slideIn 220ms ease both' };
const optionStyle = (active: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 58, marginTop: 10, padding: '12px 16px', borderRadius: 16, border: `2px solid ${active ? '#C4614A' : '#F0E1D6'}`, background: active ? '#FFF0EB' : '#fff', color: active ? '#C4614A' : '#2A1F1A', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' });
const chipRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const chipStyle = (active: boolean): CSSProperties => ({ padding: '12px 22px', borderRadius: 14, border: `1.5px solid ${active ? '#C4614A' : '#E8D8CE'}`, background: active ? '#D5634D' : '#fff', color: active ? '#fff' : '#2A1F1A', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' });
const iconPillStyle: CSSProperties = { display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 999, background: '#FCE9E3', color: '#C4614A', flex: '0 0 auto' };
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #E8D8CE', background: '#fff', fontSize: 16, fontFamily: 'inherit' };
const textareaStyle: CSSProperties = { ...inputStyle, minHeight: 150, resize: 'none', lineHeight: 1.55 };
const counterStyle: CSSProperties = { position: 'absolute', right: 14, bottom: 12, color: '#9B8E86', fontSize: 12 };
const listStyle: CSSProperties = { display: 'grid', gap: 8, marginTop: 12 };
const rowStyle = (active: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${active ? '#C4614A' : '#EFE4DC'}`, background: active ? '#FFF0EB' : '#fff', color: '#2A1F1A', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' });
const summaryCardStyle: CSSProperties = { ...rowStyle(false), marginBottom: 10, minHeight: 76 };
const ctaStyle: CSSProperties = { marginTop: 18, width: '100%', border: 'none', borderRadius: 16, padding: '16px 0', background: 'linear-gradient(180deg, #D86C57, #C95842)', color: '#fff', fontSize: 17, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 12px 24px rgba(196,97,74,0.20)' };
const textButtonStyle: CSSProperties = { marginTop: 14, border: 0, background: 'transparent', color: '#74675F', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 };
const safeNoteStyle: CSSProperties = { margin: '12px 0 0', textAlign: 'center', color: '#74675F', fontSize: 13, fontWeight: 700 };
const warningStyle: CSSProperties = { margin: '14px 0 0', padding: '12px 14px', borderRadius: 14, background: '#FFF3EA', color: '#6B5E55', fontSize: 13, fontWeight: 800 };
const previewRowStyle: CSSProperties = { margin: '12px 0 0', padding: '12px 14px', borderRadius: 14, border: '1px solid #EFE4DC', background: '#FFFaf6', color: '#5B504A', fontWeight: 800 };
const progressTrackStyle: CSSProperties = { width: '100%', height: 6, borderRadius: 999, background: '#EFE4DC', overflow: 'hidden' };
const progressFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: '#D5634D' };
const successBannerStyle: CSSProperties = { padding: '12px 16px', borderRadius: 14, background: '#F2F8E9', color: '#2F5F3B', fontSize: 15, fontWeight: 900, textAlign: 'center' };
const timeChipStyle: CSSProperties = { padding: '8px 10px', borderRadius: 999, background: '#F7F0E9', fontWeight: 900 };
