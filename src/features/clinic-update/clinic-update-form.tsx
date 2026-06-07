'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import type { ClinicUpdate, Medication, ScheduleItem, ScheduleType } from '../../types/slc.types';
import type { ClinicGuideAnswer, ClinicGuideMedicationNormalizeResponse, ClinicGuideResponse, ClinicGuideStep } from '../../types/clinic-guide.types';
import { resolveMedicationNames } from '../../domain/clinic-guide-medication-normalizer';
import { buildClinicUpdateScheduleItems, prefillNextVisitDate } from '../../domain/slc-clinic-update';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';

type MedicationOption = Pick<Medication, 'id' | 'brand_name_ko' | 'brand_name_en' | 'aliases' | 'default_unit' | 'default_cta'>;

type Step = 'entry' | 'photo_processing' | 'text_paste' | 'diff_review' | 'manual_entry' | 'same_med' | 'new_med' | 'days' | 'memo' | 'confirm' | 'success';
type MedicationChangeAnswer = 'same' | 'changed' | 'unknown' | null;
type NewMedicationIntent = 'yes' | 'no' | null;
type SavedScheduleItem = { title: string; scheduledAt: string; unit: string | null };
type ClinicUpdateSaveScheduleItem = { title: string; scheduledAt?: string; scheduled_at?: string; unit: string | null };
type ClinicUpdateSaveResponse = { ok?: boolean; reviewRequired?: boolean; candidates?: ApiCandidate[]; scheduleItems?: ClinicUpdateSaveScheduleItem[]; error?: string };
type PhotoPhase = 'idle' | 'uploading' | 'uploaded' | 'analyzing' | 'ready' | 'not_found';
type ExtractedCandidate = { id: string; type: ScheduleType; title: string; scheduled_at: string | null; dose: string | null; unit: string | null; decision: 'confirmed' | 'rejected' };
type ApiCandidate = { id?: unknown; type?: unknown; title?: unknown; scheduled_at?: unknown; dose?: unknown; unit?: unknown };
type CurrentScheduleItem = Pick<ScheduleItem, 'id' | 'type' | 'title' | 'scheduled_at' | 'dose' | 'unit' | 'status'>;
type ClinicUpdateMode = 'schedule' | 'memo';

interface Props {
  medications: MedicationOption[];
  partnerConnected?: boolean;
  currentItems?: CurrentScheduleItem[];
  mode?: ClinicUpdateMode;
}

interface FormState {
  medicationChange: MedicationChangeAnswer;
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
const INTERVIEW_PROGRESS_TOTAL = 4;
const INTERVIEW_PROGRESS_LABELS = ['1/4', '2/4', '3/4', '4/4'] as const;

const MODE_COPY = {
  schedule: {
    entryTitle: '일정을 추가할게요',
    entrySubtitle: '사진이나 문자에서 일정 후보를 찾고, 저장 전 직접 확인해요.',
    methodLabel: '일정 입력 방법',
    photoAction: '사진으로 일정 추가',
    photoDescription: '처방전·안내문을 찍고 후보만 확인해요.',
    textAction: '문자로 일정 추가',
    textDescription: '문자·카톡 안내를 붙여넣고 비교해요.',
    textAriaLabel: '일정 안내 문자',
    textTitle: '문자로 일정 추가',
    textSubtitle: '병원 문자나 메신저 안내를 그대로 붙여넣어 주세요.',
    diffTitle: '겹치는 일정이 있어요',
    diffDescription: '기존 일정과 새 후보를 비교한 뒤 저장할 항목을 선택해 주세요.',
    applyLabel: '일정 적용',
  },
  memo: {
    entryTitle: '진료 내용을 남겨주세요',
    entrySubtitle: '병원에서 확인한 다음 일정, 약 변경, 메모만 차분히 정리해요.',
    methodLabel: '진료 내용 입력 방법',
    photoAction: '안내문 사진으로 남기기',
    photoDescription: '처방전·안내문을 찍고 확인할 일정만 골라요.',
    textAction: '문자로 받은 안내 붙여넣기',
    textDescription: '문자·카톡 안내를 그대로 붙여넣고 확인해요.',
    textAriaLabel: '병원 안내 문자',
    textTitle: '문자로 받은 안내를 붙여넣어 주세요',
    textSubtitle: '병원 문자나 메신저 안내에서 일정 후보만 정리해요.',
    diffTitle: '겹치는 일정이 있어요',
    diffDescription: '기존 일정과 새 후보를 비교한 뒤 저장할 항목을 선택해 주세요.',
    applyLabel: '확인한 일정 저장',
  },
} as const satisfies Record<ClinicUpdateMode, Record<string, string>>;

export function ClinicUpdateForm({ medications, partnerConnected = false, currentItems = [], mode = 'memo' }: Props) {
  const router = useRouter();
  const copy = MODE_COPY[mode];
  const [step, setStep] = useState<Step>('entry');
  const [saving, setSaving] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [normalizedMedication, setNormalizedMedication] = useState<Medication | null>(null);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savedScheduleItems, setSavedScheduleItems] = useState<SavedScheduleItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('병원에서 들은 내용을 답하면 다음 질문과 정리 초안을 업데이트해요.');
  const [aiChips, setAiChips] = useState<string[]>(['그대로예요', '바뀌었어요', '잘 모르겠어요']);
  const [aiDraft, setAiDraft] = useState<Partial<ClinicUpdate>>({});
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiAnswers, setAiAnswers] = useState<ClinicGuideAnswer[]>([]);
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('idle');
  const [captureMessage, setCaptureMessage] = useState('병원 안내를 사진이나 문자로 가져올 수 있어요.');
  const [textPasteValue, setTextPasteValue] = useState('');
  const [analyzingText, setAnalyzingText] = useState(false);
  const [extractedCandidates, setExtractedCandidates] = useState<ExtractedCandidate[]>([]);
  const [applyingCandidates, setApplyingCandidates] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormState>({
    medicationChange: null,
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
  const selectedSchedulePreview = buildSelectedSchedulePreview(medicationOptions, form.addedMedicationIds, form.directMedicationTitle);
  const nextVisitPreview = form.nextVisitAt ? formatKoreanVisitDate(form.nextVisitAt) : '미정';

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

  const runInterview = async (clinicStep: ClinicGuideStep, userInput: string, formSnapshot = form) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;
    const answerHistory = [...aiAnswers, { step: clinicStep, answer: trimmed }].slice(-8);
    setAiAnswers(answerHistory);
    setAiLoading(true);
    setAiError(null);
    const response = await fetch('/api/clinic-guide/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: clinicStep,
        userInput: trimmed,
        context: clinicGuideContextFromForm(formSnapshot),
        answerHistory,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      setAiAvailable(false);
      setAiLoading(false);
      return;
    }
    const payload = await response.json().catch(() => null) as ClinicGuideResponse | null;
    if (!payload?.requiresUserConfirmation || payload.source !== 'ai') {
      if (payload?.draft) setAiDraft(payload.draft);
      setAiAvailable(false);
      setAiLoading(false);
      return;
    }
    setAiQuestion(payload.question);
    setAiChips(payload.chips ?? []);
    setAiDraft(payload.draft);
    setAiAvailable(true);
    setAiError(null);
    setAiLoading(false);
  };

  const chooseMedicationChange = (answer: Exclude<MedicationChangeAnswer, null>) => {
    const nextForm = { ...form, medicationChange: answer };
    setForm(nextForm);
    void runInterview('same_medication', medicationChangeLabel(answer), nextForm);
  };

  const chooseMedicationFromList = (medication: MedicationOption) => {
    const selected = form.addedMedicationIds.includes(medication.id)
      ? form.addedMedicationIds.filter((id) => id !== medication.id)
      : [...form.addedMedicationIds, medication.id];
    const nextForm = { ...form, addedMedicationIds: selected };
    setForm(nextForm);
    void runInterview('add_medication', medication.brand_name_ko, nextForm);
  };

  const setMedicationId = (medicationId: string) => {
    setForm((current) => ({
      ...current,
      addedMedicationIds: current.addedMedicationIds.includes(medicationId)
        ? current.addedMedicationIds.filter((id) => id !== medicationId)
        : [...current.addedMedicationIds, medicationId],
    }));
  };

  const syncDirectMedication = (rawTitle: string) => {
    const title = rawTitle.trim();
    if (!title) {
      setShowDirectInput(true);
      return;
    }
    const directId = `${DIRECT_PREFIX}${title}`;
    setForm((current) => ({
      ...current,
      directMedicationTitle: title,
      addedMedicationIds: [...current.addedMedicationIds.filter((id) => !id.startsWith(DIRECT_PREFIX)), directId],
    }));
    setShowDirectInput(true);
  };

  const addDirectMedication = () => {
    const title = form.directMedicationTitle || form.medicationSearch;
    syncDirectMedication(title);
    void runInterview('add_medication', title || '직접 입력');
  };

  const updateDirectMedicationTitle = (rawTitle: string) => {
    const title = rawTitle.trim();
    setForm((current) => ({
      ...current,
      directMedicationTitle: rawTitle,
      addedMedicationIds: title
        ? [...current.addedMedicationIds.filter((id) => !id.startsWith(DIRECT_PREFIX)), `${DIRECT_PREFIX}${title}`]
        : current.addedMedicationIds.filter((id) => !id.startsWith(DIRECT_PREFIX)),
    }));
  };

  const setNewMedicationIntent = (intent: Exclude<NewMedicationIntent, null>) => {
    const nextForm = {
      ...form,
      newMedicationIntent: intent,
      ...(intent === 'no'
        ? {
          addedMedicationIds: [],
          directMedicationTitle: '',
          medicationSearch: '',
        }
        : {}),
    };
    setForm(nextForm);
    void runInterview('add_medication', intent === 'yes' ? '새 약 있어요' : '새 약 없어요', nextForm);
    if (intent === 'no') {
      setShowDirectInput(false);
      setNormalizedMedication(null);
    }
  };

  const chooseDays = (days: number) => {
    const nextForm = { ...form, medicationDays: days, customDays: String(days) };
    setForm(nextForm);
    setShowDatePicker(false);
    void runInterview('medication_days', `${days}일`, nextForm);
  };

  const acceptVisitSuggestion = () => {
    if (!form.medicationDays) return;
    const nextVisitAt = prefillNextVisitDate(form.medicationDays ?? 1);
    const nextForm = { ...form, nextVisitAt };
    setForm(nextForm);
    setShowDatePicker(false);
    void runInterview('next_visit', nextVisitAt, nextForm);
  };

  const startManualEntry = () => {
    setCaptureMessage('직접 입력으로 계속할게요.');
    setStep('manual_entry');
  };

  const handleCaptureNotFound = () => {
    setPhotoPhase('not_found');
    setCaptureMessage('찾지 못했어요');
    window.setTimeout(startManualEntry, 900);
  };

  const processPhotoFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoPhase('uploading');
    setCaptureMessage('사진을 업로드하고 있어요.');
    setAiError(null);

    try {
      const formData = new FormData();
      formData.set('file', file);
      const uploadResponse = await fetch('/api/onboard/photo-upload', { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('upload_failed');
      const uploadPayload = await uploadResponse.json() as { path?: string };
      if (!uploadPayload.path) throw new Error('upload_failed');

      setPhotoPhase('uploaded');
      setCaptureMessage('업로드 완료');
      await wait(350);

      setPhotoPhase('analyzing');
      setCaptureMessage('분석 중');
      const analyzeResponse = await fetch('/api/onboard/photo-analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imagePath: uploadPayload.path }),
      });
      if (!analyzeResponse.ok) throw new Error('analyze_failed');
      const analyzePayload = await analyzeResponse.json() as { candidates?: ApiCandidate[] };
      const candidates = normalizeExtractedCandidates(analyzePayload.candidates);
      if (!candidates.length) {
        handleCaptureNotFound();
        return;
      }

      setExtractedCandidates(candidates);
      setPhotoPhase('ready');
      setCaptureMessage('후보 준비');
      await wait(350);
      setStep('diff_review');
    } catch {
      handleCaptureNotFound();
    }
  };

  const analyzePastedText = async () => {
    const rawText = textPasteValue.trim();
    if (!rawText) {
      setCaptureMessage('병원 안내 문자를 붙여넣어 주세요.');
      return;
    }

    setAnalyzingText(true);
    setCaptureMessage('분석 중');
    setAiError(null);
    try {
      const response = await fetch('/api/clinic-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sameMedication: null,
          addedMedicationIds: [],
          medicationDays: null,
          nextVisitAt: null,
          triggerPlan: '',
          memo: rawText,
          newScheduleItems: [],
        }),
      });
      if (!response.ok) throw new Error('manual_memo_bridge_failed');
      const payload = await response.json() as ClinicUpdateSaveResponse;
      const candidates = normalizeExtractedCandidates(payload.candidates);
      if (!candidates.length) {
        handleCaptureNotFound();
        return;
      }

      setExtractedCandidates(candidates);
      setCaptureMessage('후보 준비');
      setStep('diff_review');
    } catch {
      handleCaptureNotFound();
    } finally {
      setAnalyzingText(false);
    }
  };

  const updateExtractedCandidate = (id: string, patch: Partial<ExtractedCandidate>) => {
    setExtractedCandidates((current) => current.map((candidate) => (candidate.id === id ? { ...candidate, ...patch } : candidate)));
  };

  const applyExtractedCandidates = async () => {
    const confirmedIds = extractedCandidates.filter((candidate) => candidate.decision === 'confirmed').map((candidate) => candidate.id);
    const rejectedIds = extractedCandidates.filter((candidate) => candidate.decision === 'rejected').map((candidate) => candidate.id);
    if (!confirmedIds.length) {
      setAiError('반영할 후보를 하나 이상 선택해 주세요.');
      return;
    }

    setApplyingCandidates(true);
    setAiError(null);
    try {
      const response = await fetch('/api/onboard/candidates/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          confirmedIds,
          rejectedIds,
          candidateEdits: extractedCandidates.map(({ id, type, title, scheduled_at, dose, unit }) => ({ id, type, title, scheduled_at, dose, unit })),
        }),
      });
      if (!response.ok) throw new Error('confirm_failed');
      router.push('/home');
    } catch {
      setAiError('변경사항을 적용하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setApplyingCandidates(false);
    }
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
        sameMedication: form.medicationChange === 'same' ? true : form.medicationChange === 'changed' ? false : null,
        addedMedicationIds: form.addedMedicationIds.filter((id) => !id.startsWith(DIRECT_PREFIX)),
        medicationDays: form.medicationDays,
        nextVisitAt: form.nextVisitAt ? new Date(form.nextVisitAt).toISOString() : null,
        triggerPlan: form.triggerPlan,
        memo: form.memo,
        newScheduleItems: scheduleItems,
      }),
    });
    const payload = await response.json().catch(() => ({})) as ClinicUpdateSaveResponse;
    if (!response.ok) {
      setAiError(payload.error ?? '변경사항을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      setSaving(false);
      return;
    }
    if (payload.reviewRequired) {
      const candidates = normalizeExtractedCandidates(payload.candidates);
      setSaving(false);
      if (!candidates.length) {
        setAiError('검토할 후보를 만들지 못했어요. 내용을 조금 더 구체적으로 입력해 주세요.');
        return;
      }
      setExtractedCandidates(candidates);
      setCaptureMessage('후보 준비');
      setStep('diff_review');
      return;
    }
    const persistedScheduleItems = payload.scheduleItems?.length ? payload.scheduleItems : scheduleItems;
    setSavedScheduleItems(persistedScheduleItems.map(normalizeSavedScheduleItem));
    setSaving(false);
    setStep('success');
  };

  if (step === 'entry') return (
    <Shell>
      <div style={{ flex: 1, display: 'grid', alignContent: 'center', gap: 18 }}>
        <h1 style={heroTitleStyle}>{copy.entryTitle.split('\\n').map((line, index) => <span key={line}>{index > 0 ? <br /> : null}{line}</span>)}</h1>
        <p style={subtitleStyle}>{copy.entrySubtitle}</p>
        <div style={methodGridStyle} aria-label={copy.methodLabel}>
          <button type="button" style={methodCardStyle} onClick={() => setStep('photo_processing')}>
            <span style={iconPillStyle}>📷</span>
            <span style={{ display: 'grid', gap: 4 }}>
              <strong>{copy.photoAction}</strong>
              <small>{copy.photoDescription}</small>
            </span>
          </button>
          <button type="button" style={methodCardStyle} onClick={() => setStep('text_paste')}>
            <span style={iconPillStyle}>✉️</span>
            <span style={{ display: 'grid', gap: 4 }}>
              <strong>{copy.textAction}</strong>
              <small>{copy.textDescription}</small>
            </span>
          </button>
          <button type="button" style={methodCardStyle} onClick={startManualEntry}>
            <span style={iconPillStyle}>✎</span>
            <span style={{ display: 'grid', gap: 4 }}>
              <strong>진료 내용 직접 남기기</strong>
              <small>사진이나 문자가 없어도 질문으로 정리해요.</small>
            </span>
          </button>
        </div>
        <p style={safeNoteStyle}>의료 판단 없이 병원에서 확인한 일정만 저장해요</p>
      </div>
      <button type="button" onClick={() => router.push('/home')} style={textButtonStyle}>나중에 할게요</button>
    </Shell>
  );

  if (step === 'photo_processing') return (
    <Shell>
      <input ref={cameraInputRef} aria-label="사진 촬영" type="file" accept="image/*" capture="environment" hidden onChange={(event) => { void processPhotoFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      <input ref={galleryInputRef} aria-label="사진 선택" type="file" accept="image/*" hidden onChange={(event) => { void processPhotoFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      <section style={questionCardStyle} aria-label="안내문 사진으로 남기기">
        <h1 style={titleStyle}>안내문 사진으로 남기기</h1>
        <p style={subtitleStyle}>병원 안내 사진을 올리면 일정 후보만 추려서 보여드려요.</p>
        <p style={statusLineStyle}>{captureMessage}</p>
        <div style={progressStepsStyle} aria-label="처리 중 상태">
          {['업로드 완료', '분석 중', '후보 준비'].map((label) => <span key={label} style={progressPillStyle(captureMessage === label)}>{label}</span>)}
        </div>
        <div style={chipRowStyle}>
          <button type="button" style={{ ...chipStyle(false), flex: 1 }} onClick={() => cameraInputRef.current?.click()}>사진 찍기</button>
          <button type="button" style={{ ...chipStyle(false), flex: 1 }} onClick={() => galleryInputRef.current?.click()}>앨범에서 선택</button>
        </div>
      </section>
      {photoPhase === 'not_found' ? <p style={warningStyle}>찾지 못했어요. 직접 입력으로 이어갈게요.</p> : null}
      <button type="button" onClick={() => setStep('entry')} style={textButtonStyle}>입력 방법 바꾸기</button>
    </Shell>
  );

  if (step === 'text_paste') return (
    <Shell>
      <section style={questionCardStyle} aria-label="문자로 받은 안내 붙여넣기">
        <h1 style={titleStyle}>{copy.textTitle}</h1>
        <p style={subtitleStyle}>{copy.textSubtitle}</p>
        <label style={{ position: 'relative', display: 'block' }}>
          <textarea
            aria-label={copy.textAriaLabel}
            value={textPasteValue}
            maxLength={1000}
            onChange={(event) => setTextPasteValue(event.target.value)}
            placeholder="예: 오늘 19:00 벰폴라 150 IU, 5월 17일 오전 내원"
            rows={7}
            style={textareaStyle}
          />
          <span style={counterStyle}>{textPasteValue.length}/1000</span>
        </label>
        <p style={statusLineStyle}>{captureMessage}</p>
        <button type="button" onClick={analyzePastedText} disabled={analyzingText} style={ctaStyle(analyzingText)}>{analyzingText ? '분석 중...' : '후보 확인하기'}</button>
      </section>
      <button type="button" onClick={startManualEntry} style={textButtonStyle}>직접 입력으로 바꾸기</button>
    </Shell>
  );

  if (step === 'manual_entry') return (
    <Shell>
      <section style={questionCardStyle} aria-label="진료 내용 직접 남기기">
        <h1 style={titleStyle}>진료 내용을 직접 남길게요</h1>
        <p style={subtitleStyle}>약 변경, 며칠치 처방, 다음 방문일을 질문으로 하나씩 확인해요.</p>
        <button type="button" onClick={() => setStep('same_med')} style={ctaStyle()}>질문으로 정리하기</button>
      </section>
      <button type="button" onClick={() => setStep('entry')} style={textButtonStyle}>입력 방법 바꾸기</button>
    </Shell>
  );

  if (step === 'diff_review') return (
    <Shell>
      <section style={questionCardStyle} aria-label="변경사항 diff 확인">
        <h1 style={titleStyle}>{copy.diffTitle}</h1>
        <p style={subtitleStyle}>{copy.diffDescription}</p>
        <div style={diffGridStyle}>
          <section style={diffColumnStyle} aria-label="현재 일정">
            <h2 style={sectionTitleStyle}>현재 일정</h2>
            {currentItems.length ? currentItems.slice(0, 4).map((item) => (
              <div key={item.id} style={currentItemStyle}>
                <span style={timeChipStyle}>{formatTime(item.scheduled_at)}</span>
                <strong>{item.title}</strong>
                <small>{formatCandidateType(item.type)} · {formatCandidateDose(item.dose, item.unit)}</small>
              </div>
            )) : <p style={emptyListStyle}>현재 일정이 없어요.</p>}
          </section>
          <section style={diffColumnStyle} aria-label="새 후보">
            <h2 style={sectionTitleStyle}>새 후보</h2>
            {extractedCandidates.map((candidate) => (
              <article key={candidate.id} style={candidateCardStyle(candidate.decision === 'confirmed')}>
                <div style={chipRowStyle}>
                  <button type="button" style={chipStyle(candidate.decision === 'confirmed')} onClick={() => updateExtractedCandidate(candidate.id, { decision: 'confirmed' })}>새 일정으로 교체</button>
                  <button type="button" style={chipStyle(candidate.decision === 'rejected')} onClick={() => updateExtractedCandidate(candidate.id, { decision: 'rejected' })}>기존 일정 유지</button>
                </div>
                <label style={fieldLabelStyle}>종류
                  <select aria-label={`${candidate.title} 종류`} value={candidate.type} onChange={(event) => updateExtractedCandidate(candidate.id, { type: event.target.value as ScheduleType })} style={inputStyle}>
                    <option value="injection">주사</option>
                    <option value="medication">약 복용</option>
                    <option value="clinic">병원 방문</option>
                  </select>
                </label>
                <label style={fieldLabelStyle}>제목
                  <input aria-label={`${candidate.title} 제목`} value={candidate.title} onChange={(event) => updateExtractedCandidate(candidate.id, { title: event.target.value })} style={inputStyle} />
                </label>
                <label style={fieldLabelStyle}>시간
                  <input aria-label={`${candidate.title} 시간`} type="datetime-local" value={toDateTimeLocal(candidate.scheduled_at)} onChange={(event) => updateExtractedCandidate(candidate.id, { scheduled_at: fromDateTimeLocal(event.target.value) })} style={inputStyle} />
                </label>
                <div style={twoColumnStyle}>
                  <label style={fieldLabelStyle}>용량
                    <input aria-label={`${candidate.title} 용량`} value={candidate.dose ?? ''} onChange={(event) => updateExtractedCandidate(candidate.id, { dose: event.target.value || null })} style={inputStyle} />
                  </label>
                  <label style={fieldLabelStyle}>단위
                    <input aria-label={`${candidate.title} 단위`} value={candidate.unit ?? ''} onChange={(event) => updateExtractedCandidate(candidate.id, { unit: event.target.value || null })} style={inputStyle} />
                  </label>
                </div>
              </article>
            ))}
          </section>
        </div>
        {aiError ? <p style={warningStyle}>{aiError}</p> : null}
        <button type="button" onClick={applyExtractedCandidates} disabled={applyingCandidates} style={ctaStyle(applyingCandidates)}>{applyingCandidates ? '적용 중...' : copy.applyLabel}</button>
      </section>
      <button type="button" onClick={startManualEntry} style={textButtonStyle}>직접 입력으로 바꾸기</button>
    </Shell>
  );

  if (step === 'same_med') return (
    <Shell header={<GuideHeader current={1} total={INTERVIEW_PROGRESS_TOTAL} aiAvailable={aiAvailable} />}>
      {aiAvailable ? (
        <AiInterviewPanel question={aiQuestion} chips={aiChips} loading={aiLoading} error={aiError} available={aiAvailable} />
      ) : (
        <QuestionCard icon="❔" title="같은 약을 계속 사용하나요?" lead="병원에서 오늘 들은 내용만 떠올려도 괜찮아요.">
          {[
            { label: '그대로', icon: '✓', value: 'same' },
            { label: '바뀌었어요', icon: '💊', value: 'changed' },
            { label: '잘 모르겠어요', icon: '?', value: 'unknown' },
          ].map((option) => (
            <button key={option.label} type="button" style={optionStyle(form.medicationChange === option.value)} onClick={() => chooseMedicationChange(option.value as Exclude<MedicationChangeAnswer, null>)}>
              <span style={iconPillStyle}>{option.icon}</span>{option.label}
            </button>
          ))}
        </QuestionCard>
      )}
      <p style={safeNoteStyle}>선택에 따라 다음 질문이 달라져요</p>
      <button type="button" disabled={!form.medicationChange} onClick={() => setStep(form.medicationChange === 'changed' ? 'new_med' : 'days')} style={ctaStyle(!form.medicationChange)}>다음</button>
    </Shell>
  );

  if (step === 'new_med') return (
    <Shell header={<GuideHeader current={2} total={INTERVIEW_PROGRESS_TOTAL} aiAvailable={aiAvailable} />}>
      {aiAvailable ? (
        <AiInterviewPanel question={aiQuestion} chips={aiChips} loading={aiLoading} error={aiError} available={aiAvailable} />
      ) : (
        <QuestionCard title="새로 받은 약이 있나요?" lead="목록에서 찾거나, 없으면 직접 입력할 수 있어요.">
          <div style={chipRowStyle}>
            {(['yes', 'no'] as const).map((intent) => (
              <button key={intent} type="button" style={chipStyle(form.newMedicationIntent === intent)} onClick={() => setNewMedicationIntent(intent)}>{intent === 'yes' ? '네' : '아니요'}</button>
            ))}
          </div>
        </QuestionCard>
      )}

      {form.newMedicationIntent === 'yes' && (
        <section style={panelStyle}>
          <input
            aria-label="약 이름 검색"
            type="search"
            value={form.medicationSearch}
            onChange={(event) => setForm((current) => ({ ...current, medicationSearch: event.target.value }))}
            placeholder="약 이름을 검색하세요"
            style={inputStyle}
          />
          <div style={listStyle}>
            {filteredMedications.map((medication) => (
              <button key={medication.id} type="button" style={rowStyle(form.addedMedicationIds.includes(medication.id))} onClick={() => chooseMedicationFromList(medication)}>
                <span style={iconPillStyle}>💊</span>
                <span><strong>{medication.brand_name_ko}</strong><small>{medication.brand_name_en}</small></span>
              </button>
            ))}
            {!filteredMedications.length ? (
              <div style={emptyFallbackStyle}>
                <p style={emptyListStyle}>검색 결과가 없어요. 직접 입력으로 추가할 수 있어요.</p>
              </div>
            ) : null}
            <button type="button" style={rowStyle(showDirectInput)} onClick={addDirectMedication}>
              <span style={iconPillStyle}>✏️</span><strong>직접 입력</strong>
            </button>
          </div>
          {showDirectInput && (
            <input
              aria-label="직접 입력 약 이름"
              value={form.directMedicationTitle}
              onChange={(event) => updateDirectMedicationTitle(event.target.value)}
              onBlur={() => syncDirectMedication(form.directMedicationTitle)}
              placeholder="목록에 없는 약 이름"
              style={{ ...inputStyle, marginTop: 10 }}
            />
          )}
          {normalizing ? <p style={safeNoteStyle}>이름 보정은 뒤에서 처리 중이에요</p> : null}
          {normalizedMedication ? (
            <button type="button" style={rowStyle(form.addedMedicationIds.includes(normalizedMedication.id))} onClick={() => { setMedicationId(normalizedMedication.id); void runInterview('add_medication', normalizedMedication.brand_name_ko); }}>
              <span style={iconPillStyle}>✦</span><span><small>정규화된 약 후보</small><strong>{normalizedMedication.brand_name_ko}</strong></span>
            </button>
          ) : null}
        </section>
      )}

      <button type="button" onClick={() => setStep('days')} style={ctaStyle()}>약 선택 완료</button>
    </Shell>
  );

  if (step === 'days') return (
    <Shell header={<GuideHeader current={3} total={INTERVIEW_PROGRESS_TOTAL} aiAvailable={aiAvailable} />}>
      {aiAvailable ? (
        <AiInterviewPanel question={aiQuestion} chips={aiChips} loading={aiLoading} error={aiError} available={aiAvailable} />
      ) : (
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
      )}

      {form.medicationDays ? (
        <section style={suggestionCardStyle} aria-label="다음 방문일 제안">
          <div style={hospitalIconStyle}>📅</div>
          <h2 style={sectionTitleStyle}>다음 방문일 제안</h2>
          <p>{form.medicationDays}일치로 입력하셨어요. 다음 방문일을 {form.medicationDays}일 뒤로 표시할까요?</p>
          <div style={chipRowStyle}>
            <button type="button" style={{ ...chipStyle(true), flex: 1 }} onClick={acceptVisitSuggestion}>네, 표시할게요</button>
            <button type="button" style={{ ...chipStyle(false), flex: 1 }} onClick={() => setShowDatePicker(true)}>날짜 수정</button>
          </div>
          {showDatePicker ? <input aria-label="다음 방문일 수정" type="date" value={form.nextVisitAt} onChange={(event) => { const nextForm = { ...form, nextVisitAt: event.target.value }; setForm(nextForm); void runInterview('next_visit', event.target.value, nextForm); }} style={inputStyle} /> : null}
          <p style={previewRowStyle}>📅 다음 방문: {nextVisitPreview}</p>
        </section>
      ) : null}

      <button type="button" onClick={() => setStep('memo')} style={ctaStyle()}>다음</button>
    </Shell>
  );

  if (step === 'memo') return (
    <Shell header={<GuideHeader current={4} total={INTERVIEW_PROGRESS_TOTAL} aiAvailable={aiAvailable} />}>
      {aiAvailable ? (
        <AiInterviewPanel question={aiQuestion} chips={aiChips} loading={aiLoading} error={aiError} available={aiAvailable} />
      ) : (
        <>
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
        </>
      )}
      <DraftPanel medicationNames={selectedMedicationNames} nextVisit={nextVisitPreview} memo={form.memo} aiDraft={aiDraft} />
      <p style={warningStyle}>⚠ 불명확한 시간은 저장 전에 다시 확인해요</p>
      <button type="button" onClick={() => { void runInterview('memo', form.memo || '메모 없음'); setStep('confirm'); }} style={ctaStyle()}>저장 전 확인</button>
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
      <button type="button" onClick={() => router.push('/home')} style={ctaStyle()}>홈으로 이동</button>
    </Shell>
  );

  return (
    <Shell>
      <h1 style={titleStyle}>저장 전 확인해주세요</h1>
      <p style={subtitleStyle}>아래 내용을 확인한 후 저장하면 오늘 일정에 즉시 반영돼요.</p>
      <DraftPanel medicationNames={selectedMedicationNames} nextVisit={nextVisitPreview} memo={form.memo} aiDraft={aiDraft} />
      <SummaryCard icon="📅" label="추가된 일정" value={selectedSchedulePreview.length ? selectedSchedulePreview.join(', ') : '추가된 약 없음'} onClick={() => setStep('new_med')} />
      <SummaryCard icon="🕐" label="다음 방문" value={nextVisitPreview} onClick={() => setStep('days')} />
      <SummaryCard icon="📄" label="메모" value={form.memo || '없음'} onClick={() => setStep('memo')} />
      <button type="button" onClick={save} disabled={saving} style={ctaStyle(saving)}>{saving ? '저장 중...' : '저장하고 업데이트'}</button>
    </Shell>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeExtractedCandidates(value: unknown): ExtractedCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.map((candidate, index) => normalizeExtractedCandidate(candidate, index)).filter((candidate): candidate is ExtractedCandidate => candidate !== null);
}

function normalizeExtractedCandidate(value: unknown, index: number): ExtractedCandidate | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as ApiCandidate;
  const type = candidate.type === 'injection' || candidate.type === 'medication' || candidate.type === 'clinic' ? candidate.type : null;
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!type || !title) return null;
  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : `candidate-${index + 1}`,
    type,
    title,
    scheduled_at: typeof candidate.scheduled_at === 'string' ? candidate.scheduled_at : null,
    dose: typeof candidate.dose === 'string' && candidate.dose.trim() ? candidate.dose.trim() : null,
    unit: typeof candidate.unit === 'string' && candidate.unit.trim() ? candidate.unit.trim() : null,
    decision: 'confirmed',
  };
}

function toDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatCandidateType(type: ScheduleType) {
  if (type === 'injection') return '주사';
  if (type === 'medication') return '약 복용';
  return '병원 방문';
}

function formatCandidateDose(dose: string | null, unit: string | null) {
  if (!dose && !unit) return '용량 미입력';
  return `${dose ?? ''}${dose && unit ? ' ' : ''}${unit ?? ''}`.trim();
}

function GuideHeader({ current, total, aiAvailable }: { current: number; total: number; aiAvailable: boolean }) {
  const label = INTERVIEW_PROGRESS_LABELS[current - 1] ?? `${current}/${total}`;
  return (
    <header style={{ display: 'grid', gap: 12, justifyItems: 'center', marginBottom: 18 }}>
      <strong style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500 }}>Fevio</strong>
      {aiAvailable ? <span style={badgeStyle}>✦ Clinic Guide AI</span> : null}
      <span style={{ color: 'var(--slc-muted)', fontWeight: 900 }}>{label}</span>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} style={progressTrackStyle}>
        <i style={{ ...progressFillStyle, width: `${(current / total) * 100}%` }} />
      </div>
    </header>
  );
}

function Shell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <AmbientStoryBackground as="main" asset={slcAssets.clinic.visitClipboard} intensity="subtle" style={containerStyle}>
      {header}{children}
    </AmbientStoryBackground>
  );
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

function DraftPanel({ medicationNames, nextVisit, memo, aiDraft }: { medicationNames: string[]; nextVisit: string; memo: string; aiDraft: Partial<ClinicUpdate> }) {
  return (
    <section style={panelStyle} aria-label="정리된 내용">
      <h2 style={{ ...sectionTitleStyle, color: 'var(--slc-text)' }}>정리된 내용</h2>
      <p>• 새 약: {medicationNames.length ? medicationNames.join(', ') : '없음'}</p>
      <p>• 다음 방문: {nextVisit}</p>
      <p>• 메모: {memo || aiDraft.memo || '없음'}</p>
      <p>• AI draft: {summarizeAiDraft(aiDraft)}</p>
      <small style={{ color: 'var(--slc-muted)', fontWeight: 800 }}>requiresUserConfirmation: true · 저장은 최종 확인 후에만 진행돼요</small>
    </section>
  );
}

function AiInterviewPanel({ question, chips, loading, error, available }: { question: string; chips: string[]; loading: boolean; error: string | null; available: boolean }) {
  if (!available) return null;
  return (
    <section style={aiPanelStyle} aria-label="Clinic Guide AI 질문">
      <strong style={{ color: 'var(--slc-muted)' }}>AI 질문</strong>
      <p style={{ margin: '8px 0', color: 'var(--slc-text)', fontWeight: 800 }}>{loading ? '다음 질문을 정리하고 있어요...' : question}</p>
      {chips.length ? <div style={chipRowStyle}>{chips.slice(0, 4).map((chip) => <span key={chip} style={aiChipStyle}>{chip}</span>)}</div> : null}
      {error ? <p style={safeNoteStyle}>{error}</p> : null}
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

function clinicGuideContextFromForm(form: FormState): Partial<ClinicUpdate> {
  return {
    same_medication: form.medicationChange === 'same' ? true : form.medicationChange === 'changed' ? false : null,
    added_medication_ids: form.addedMedicationIds.filter((id) => !id.startsWith(DIRECT_PREFIX)),
    medication_days: form.medicationDays,
    next_visit_at: form.nextVisitAt ? new Date(form.nextVisitAt).toISOString() : null,
    trigger_plan: normalizeTriggerPlanForContext(form.triggerPlan),
    memo: form.memo || null,
  };
}

function normalizeTriggerPlanForContext(value: string): ClinicUpdate['trigger_plan'] {
  if (value === 'today' || value === 'tomorrow' || value === 'not_yet' || value === 'unknown') return value;
  return null;
}

function medicationChangeLabel(answer: Exclude<MedicationChangeAnswer, null>) {
  if (answer === 'same') return '그대로예요';
  if (answer === 'changed') return '바뀌었어요';
  return '잘 모르겠어요';
}

function summarizeAiDraft(draft: Partial<ClinicUpdate>) {
  const parts = [
    draft.same_medication === true ? '같은 약 유지' : draft.same_medication === false ? '약 변경 가능성' : null,
    draft.medication_days ? `${draft.medication_days}일치` : null,
    draft.next_visit_at ? '다음 방문 후보 있음' : null,
    draft.trigger_plan ? `트리거: ${triggerPlanLabel(draft.trigger_plan)}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(' · ') : '응답 대기 중';
}

function triggerPlanLabel(value: NonNullable<ClinicUpdate['trigger_plan']>) {
  if (value === 'today') return '오늘';
  if (value === 'tomorrow') return '내일';
  if (value === 'not_yet') return '아직 미정';
  return '잘 모름';
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s\-_()]/gu, '');
}

function resolveSelectedMedicationNames(medications: Pick<Medication, 'id' | 'brand_name_ko'>[], ids: string[], directTitle: string) {
  const directIds = ids.filter((id) => id.startsWith(DIRECT_PREFIX)).map((id) => id.slice(DIRECT_PREFIX.length));
  return [...resolveMedicationNames(medications, ids.filter((id) => !id.startsWith(DIRECT_PREFIX))), ...directIds].filter((name) => name || directTitle);
}

function buildSelectedSchedulePreview(
  medications: Pick<Medication, 'id' | 'brand_name_ko' | 'default_unit'>[],
  ids: string[],
  directTitle: string,
) {
  const medicationPreview = medications
    .filter((medication) => ids.includes(medication.id))
    .map((medication) => `${medication.brand_name_ko}${medication.default_unit ? ` ${medication.default_unit}` : ''} 오늘 19:00`);
  const directPreview = ids
    .filter((id) => id.startsWith(DIRECT_PREFIX))
    .map((id) => `${id.slice(DIRECT_PREFIX.length) || directTitle} 오늘 19:00`);
  return [...medicationPreview, ...directPreview].filter(Boolean);
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
  const visitAt = nextVisitAt ? `${nextVisitAt}T09:00:00.000` : todayAtLocalTime('19:00');
  return names.length
    ? names.map((title) => ({ title, scheduledAt: todayAtLocalTime('19:00'), unit: null }))
    : [{ title: '다음 병원 방문', scheduledAt: visitAt, unit: null }];
}

function formatKoreanVisitDate(value: string) {
  const date = new Date(`${value}T10:00:00`);
  if (Number.isNaN(date.getTime())) return '미정';
  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일 오전 10:00`;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '09:00';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function todayAtLocalTime(time: '19:00') {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

const containerStyle: CSSProperties = { padding: 'var(--fevio-page-top) var(--fevio-page-gutter) var(--fevio-page-bottom)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #FFFCF7 0%, #F8F1E9 100%)', color: 'var(--slc-text)' };
const heroTitleStyle: CSSProperties = { margin: 0, textAlign: 'center', fontSize: 34, fontWeight: 900, letterSpacing: 0, lineHeight: 1.15, wordBreak: 'keep-all' };
const titleStyle: CSSProperties = { margin: '0 0 8px', textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: 0, lineHeight: 1.25, wordBreak: 'keep-all' };
const sectionTitleStyle: CSSProperties = { margin: '0 0 8px', fontSize: 16, fontWeight: 900 };
const subtitleStyle: CSSProperties = { margin: '0 0 18px', textAlign: 'center', fontSize: 15, color: '#74675F', lineHeight: 1.55 };
const badgeStyle: CSSProperties = { justifySelf: 'center', width: 'fit-content', padding: '8px 14px', borderRadius: 999, background: 'var(--slc-surface-warm)', color: 'var(--slc-muted)', fontSize: 14, fontWeight: 900 };
const methodGridStyle: CSSProperties = { display: 'grid', gap: 12 };
const methodCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px 1fr', gap: '4px 12px', alignItems: 'center', width: '100%', padding: '16px 18px', borderRadius: 20, border: '1.5px solid #F0E1D6', background: 'rgba(255,255,255,0.88)', boxShadow: '0 12px 28px rgba(82,57,45,0.08)', color: 'var(--slc-text)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' };
const statusLineStyle: CSSProperties = { margin: '12px 0', padding: '12px 14px', borderRadius: 14, background: 'var(--slc-surface-warm)', border: '1px solid var(--slc-border)', color: 'var(--slc-muted)', fontSize: 14, fontWeight: 900, textAlign: 'center' };
const progressStepsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '12px 0 16px' };
const progressPillStyle = (active: boolean): CSSProperties => ({ padding: '8px 6px', borderRadius: 999, background: active ? '#D5634D' : '#F7F0E9', color: active ? '#fff' : '#74675F', fontSize: 12, fontWeight: 900, textAlign: 'center' });
const diffGridStyle: CSSProperties = { display: 'grid', gap: 12, marginTop: 12 };
const diffColumnStyle: CSSProperties = { display: 'grid', gap: 10, padding: 12, borderRadius: 18, background: '#FFFCFA', border: '1px solid #F0E1D6' };
const currentItemStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', alignItems: 'center', padding: '12px 10px', borderRadius: 14, background: '#fff', border: '1px solid #EFE4DC' };
const candidateCardStyle = (active: boolean): CSSProperties => ({ display: 'grid', gap: 10, padding: 12, borderRadius: 16, background: active ? '#FFF8F5' : '#fff', border: `1.5px solid ${active ? 'var(--slc-coral)' : '#EFE4DC'}` });
const fieldLabelStyle: CSSProperties = { display: 'grid', gap: 6, color: '#74675F', fontSize: 12, fontWeight: 900 };
const twoColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 };
const hospitalIconStyle: CSSProperties = { display: 'grid', placeItems: 'center', width: 58, height: 58, borderRadius: 999, background: 'var(--slc-surface-warm)', color: 'var(--slc-muted)', fontSize: 28, margin: '0 auto 8px' };
const questionCardStyle: CSSProperties = { padding: 20, border: '1px solid #F0E1D6', borderRadius: 24, background: 'rgba(255,255,255,0.88)', boxShadow: '0 12px 28px rgba(82,57,45,0.08)' };
const panelStyle: CSSProperties = { marginTop: 16, padding: 16, border: '1px solid #F0E1D6', borderRadius: 18, background: 'rgba(255,255,255,0.78)' };
const aiPanelStyle: CSSProperties = { marginTop: 14, padding: 14, border: '1px solid #F4D4C8', borderRadius: 18, background: '#FFF8F5' };
const suggestionCardStyle: CSSProperties = { ...panelStyle, textAlign: 'center', animation: 'slideIn 220ms ease both' };
const optionStyle = (active: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 58, marginTop: 10, padding: '12px 16px', borderRadius: 16, border: `2px solid ${active ? 'var(--slc-coral)' : '#F0E1D6'}`, background: active ? 'var(--slc-coral-light)' : '#fff', color: active ? 'var(--slc-coral)' : 'var(--slc-text)', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' });
const chipRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const chipStyle = (active: boolean): CSSProperties => ({ padding: '12px 22px', borderRadius: 14, border: `1.5px solid ${active ? 'var(--slc-coral)' : '#E8D8CE'}`, background: active ? '#D5634D' : '#fff', color: active ? '#fff' : 'var(--slc-text)', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' });
const aiChipStyle: CSSProperties = { padding: '8px 12px', borderRadius: 999, background: 'var(--slc-surface-warm)', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 900 };
const iconPillStyle: CSSProperties = { display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 999, background: 'var(--slc-surface-warm)', color: 'var(--slc-muted)', flex: '0 0 auto' };
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #E8D8CE', background: '#fff', fontSize: 16, fontFamily: 'inherit' };
const textareaStyle: CSSProperties = { ...inputStyle, minHeight: 150, resize: 'none', lineHeight: 1.55 };
const counterStyle: CSSProperties = { position: 'absolute', right: 14, bottom: 12, color: 'var(--slc-muted)', fontSize: 12 };
const listStyle: CSSProperties = { display: 'grid', gap: 8, marginTop: 12 };
const rowStyle = (active: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${active ? 'var(--slc-coral)' : '#EFE4DC'}`, background: active ? 'var(--slc-coral-light)' : '#fff', color: 'var(--slc-text)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' });
const summaryCardStyle: CSSProperties = { ...rowStyle(false), marginBottom: 10, minHeight: 76 };
const emptyFallbackStyle: CSSProperties = { display: 'grid', justifyItems: 'center', padding: '10px 0' };
const emptyListStyle: CSSProperties = { margin: '4px 0', padding: '12px 14px', borderRadius: 14, background: '#FFFCFA', border: '1px dashed var(--slc-border)', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 };
const ctaStyle = (disabled = false): CSSProperties => ({ marginTop: 18, width: '100%', minHeight: 52, border: 'none', borderRadius: 16, padding: '16px 0', background: 'linear-gradient(180deg, #D86C57, #C95842)', color: '#fff', fontSize: 17, fontWeight: 900, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer', boxShadow: '0 12px 24px rgba(196,97,74,0.20)', opacity: disabled ? 0.55 : 1 });
const textButtonStyle: CSSProperties = {
  minHeight: 44,
  marginTop: 14,
  padding: '10px 16px',
  border: 0,
  background: 'transparent',
  color: '#74675F',
  fontSize: 14,
  fontWeight: 800,
  fontFamily: 'inherit',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 4,
};
const safeNoteStyle: CSSProperties = { margin: '12px 0 0', textAlign: 'center', color: '#74675F', fontSize: 13, fontWeight: 700 };
const warningStyle: CSSProperties = { margin: '14px 0 0', padding: '12px 14px', borderRadius: 14, background: '#FFF3EA', color: '#6B5E55', fontSize: 13, fontWeight: 800 };
const previewRowStyle: CSSProperties = { margin: '12px 0 0', padding: '12px 14px', borderRadius: 14, border: '1px solid #EFE4DC', background: '#FFFaf6', color: '#5B504A', fontWeight: 800 };
const progressTrackStyle: CSSProperties = { width: '100%', height: 6, borderRadius: 999, background: '#EFE4DC', overflow: 'hidden' };
const progressFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'var(--slc-coral-light)' };
const successBannerStyle: CSSProperties = { padding: '12px 16px', borderRadius: 14, background: '#F2F8E9', color: '#2F5F3B', fontSize: 15, fontWeight: 900, textAlign: 'center' };
const timeChipStyle: CSSProperties = { padding: '8px 10px', borderRadius: 999, background: '#F7F0E9', fontWeight: 900 };
