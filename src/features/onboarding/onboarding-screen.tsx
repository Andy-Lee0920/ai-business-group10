'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  buildFirstScheduleDraft,
  FIRST_SCHEDULE_CHIPS,
  hasRequiredConsentChecks,
  nextOnboardingStep,
  ONBOARDING_CONSENT_CHECKS,
  type ConsentCheckState,
  type FirstScheduleChipId,
  type FirstScheduleDraft,
  type OnboardingRole,
  type OnboardingStep,
} from './onboarding-flow';
import { RoleButton, backButtonStyle, checkStyle, ctaStyle, errorStyle, inputStyle, leadStyle, onboardingTokens, screenStyle, titleStyle } from './onboarding-ui';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';
import type { Medication } from '../../types/slc.types';

type MedicationNormalizeResponse = {
  matched: Medication | null;
  source: 'aliases' | 'llm' | 'none';
};

interface Props {
  inviteCode?: string;
}

const todayDate = () => new Date().toISOString().slice(0, 10);

export function OnboardingScreen({ inviteCode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('brand_intro');
  const [role, setRole] = useState<OnboardingRole | null>(inviteCode ? 'partner' : null);
  const [inputCode, setInputCode] = useState(inviteCode ?? '');
  const [consentChecks, setConsentChecks] = useState<ConsentCheckState>({});
  const [chipId, setChipId] = useState<FirstScheduleChipId>('injection');
  const [title, setTitle] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState('21:00');
  const [optionalMemo, setOptionalMemo] = useState('');
  const [medicationQuery, setMedicationQuery] = useState('');
  const [matchedMedication, setMatchedMedication] = useState<Medication | null>(null);
  const [assistSource, setAssistSource] = useState<MedicationNormalizeResponse['source']>('none');
  const [normalizing, setNormalizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAccepted = hasRequiredConsentChecks(consentChecks);
  const partnerCodeMissing = role === 'partner' && !inputCode.trim();
  const scheduledAt = useMemo(() => toKstIso(date, time), [date, time]);
  const usesMedicationFields = chipId !== 'clinic';
  const firstScheduleDraft = useMemo<FirstScheduleDraft | null>(() => buildFirstScheduleDraft({
    chipId,
    title: title || (usesMedicationFields ? matchedMedication?.brand_name_ko || medicationQuery : ''),
    scheduledAt,
    dose: usesMedicationFields ? dose : null,
    unit: usesMedicationFields ? unit : null,
    optionalMemo,
    matchedMedication: usesMedicationFields ? matchedMedication : null,
    assistSource: usesMedicationFields ? assistSource : 'none',
  }), [assistSource, chipId, date, dose, matchedMedication, medicationQuery, optionalMemo, scheduledAt, time, title, unit, usesMedicationFields]);

  const selectRole = (nextRole: OnboardingRole) => {
    setRole(nextRole);
    setConsentChecks({});
    setError(null);
  };

  function go(nextStep: OnboardingStep) {
    setError(null);
    setStep(nextStep);
  }

  function proceedFromRole() {
    if (!role) return;
    go(nextOnboardingStep('role_selection', role));
  }

  function proceedFromConsent() {
    if (!role || !allAccepted || partnerCodeMissing) return;
    if (role === 'partner') void submit({ skipFirstSchedule: true });
    else go(nextOnboardingStep('patient_consent', role));
  }

  async function normalizeMedication() {
    const userInput = medicationQuery.trim();
    if (!userInput) return;
    setNormalizing(true);
    setError(null);
    try {
      const response = await fetch('/api/clinic-guide/normalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userInput }),
      });
      const payload = await response.json() as MedicationNormalizeResponse | { error?: string };
      if (!response.ok || !('source' in payload)) {
        setMatchedMedication(null);
        setAssistSource('none');
        return;
      }
      setMatchedMedication(payload.matched);
      setAssistSource(payload.source);
      if (payload.matched && !title.trim()) setTitle(payload.matched.brand_name_ko);
    } finally {
      setNormalizing(false);
    }
  }

  async function submit({ skipFirstSchedule = false }: { skipFirstSchedule?: boolean } = {}) {
    if (!role || !allAccepted || partnerCodeMissing) return;
    if (role === 'patient' && !skipFirstSchedule && !firstScheduleDraft) {
      setError('저장할 첫 일정을 확인하거나 나중에 할게요를 선택해 주세요.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role,
          inviteCode: role === 'partner' ? inputCode.trim() : undefined,
          consentChecks,
          firstSchedule: skipFirstSchedule ? undefined : firstScheduleDraft,
          skipFirstSchedule,
        }),
      });
      const payload = await response.json() as { ok?: boolean; redirectTo?: string; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? SLC_SAFE_COPY.onboardingSaveFailed);
        return;
      }
      router.replace(payload.redirectTo ?? '/home');
    } catch {
      setError(SLC_SAFE_COPY.onboardingSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'brand_intro') return (
    <div style={screenStyle}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>Fevio</p>
        <div aria-hidden style={{ display: 'grid', placeItems: 'center', width: 132, height: 132, borderRadius: onboardingTokens.radiusPill, margin: '0 auto 28px', background: 'radial-gradient(circle, #FCE1D8, #FFF7EF 70%)', fontSize: 64 }}>🌿♡</div>
        <h1 style={{ ...titleStyle, textAlign: 'center', fontFamily: 'Georgia, serif', fontSize: 36 }}>Fevio</h1>
        <p style={{ ...leadStyle, textAlign: 'center', fontSize: 18, color: onboardingTokens.textMain }}>오늘의 주사와 약을 조용히 챙겨드릴게요</p>
        <p style={{ ...leadStyle, textAlign: 'center' }}>병원 안내를 사용자가 확인한 일정으로 바꿔서 첫 화면에 보여드립니다.</p>
        <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
          {['역할 선택', '동의 후 일정 저장', 'Home에서 오늘 일정 확인'].map((label) => (
            <div key={label} style={{ minHeight: 44, padding: '14px 16px', borderRadius: onboardingTokens.radiusCard, background: '#fff', border: `1.5px solid ${onboardingTokens.border}`, color: '#6B5E55', fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>
      </div>
      {stepDots(step)}
      <button type="button" onClick={() => go('role_selection')} style={ctaStyle(false)}>시작하기</button>
    </div>
  );

  if (step === 'role_selection') return (
    <div style={screenStyle}>
      <button type="button" onClick={() => go('brand_intro')} style={backButtonStyle}>← 처음으로</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>역할 선택</p>
        <h1 style={titleStyle}>어떤 역할로 시작하시나요?</h1>
        <p style={leadStyle}>역할에 따라 오늘 보이는 화면과 공유 범위가 달라집니다.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} data-testid="role-split-cards">
          <RoleButton active={role === 'patient'} icon="♡" title="기록자" description="병원 안내를 직접 확인하고 저장합니다." onClick={() => selectRole('patient')} />
          <RoleButton active={role === 'partner'} icon="👥" title="파트너" description="초대 코드로 읽기 전용 화면을 봅니다." onClick={() => selectRole('partner')} />
        </div>
      </div>
      {stepDots(step)}
      <button type="button" onClick={proceedFromRole} disabled={!role} style={ctaStyle(!role)}>다음</button>
    </div>
  );

  if (step === 'patient_consent' || step === 'partner_consent') return (
    <div style={screenStyle}>
      <button type="button" onClick={() => go('role_selection')} style={backButtonStyle}>← 역할 선택</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>동의 확인</p>
        <h1 style={titleStyle}>Fevio 민감정보 동의</h1>
        <p style={leadStyle}>아래 4가지를 직접 확인해야 병원 안내와 일정이 저장됩니다.</p>
        {role === 'partner' && (
          <label style={{ display: 'block', marginTop: 18 }}>
            <span style={{ display: 'block', marginBottom: 8, color: '#9B8E86', fontSize: 14 }}>초대 코드 입력</span>
            <input aria-label="초대 코드" placeholder="치료자가 공유한 초대 코드" value={inputCode} onChange={(event) => setInputCode(event.target.value)} style={inputStyle} />
          </label>
        )}
        <section aria-label="Fevio 민감정보 동의" style={{ marginTop: 22, display: 'grid', gap: 10 }}>
          {ONBOARDING_CONSENT_CHECKS.map((item) => (
            <label key={item.key} style={checkStyle}>
              <input type="checkbox" checked={consentChecks[item.key] === true} onChange={(event) => setConsentChecks((prev) => ({ ...prev, [item.key]: event.target.checked }))} style={{ width: 18, height: 18, accentColor: onboardingTokens.primary, flex: '0 0 auto' }} />
              <span><strong style={{ display: 'block', color: onboardingTokens.textMain }}>{item.label}</strong>{item.detail}</span>
            </label>
          ))}
        </section>
      </div>
      {stepDots(step)}
      {error && <p style={errorStyle}>{error}</p>}
      <button type="button" onClick={proceedFromConsent} disabled={!role || !allAccepted || partnerCodeMissing || saving} style={ctaStyle(!role || !allAccepted || partnerCodeMissing || saving)}>
        {saving ? '저장 중...' : role === 'partner' ? '동의하고 연결하기' : '첫 일정 입력하기'}
      </button>
    </div>
  );

  if (step === 'first_schedule_interview') return (
    <div style={screenStyle}>
      <button type="button" onClick={() => go('patient_consent')} style={backButtonStyle}>← 동의 확인</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>첫 일정 등록</p>
        <h1 style={titleStyle}>처음 확인할 일정을 하나만 남겨주세요</h1>
        <p style={leadStyle}>{usesMedicationFields ? '약 이름 찾기는 선택 사항입니다. 확인 전에는 저장하지 않습니다.' : '방문 일정은 약품 검색 없이 날짜와 시간만 먼저 확인합니다.'}</p>
        <div role="group" aria-label="첫 일정 종류" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {FIRST_SCHEDULE_CHIPS.map((chip) => (
            <button key={chip.id} type="button" onClick={() => setChipId(chip.id)} style={{ minHeight: 78, borderRadius: 16, border: `1.5px solid ${chipId === chip.id ? onboardingTokens.primary : onboardingTokens.border}`, background: chipId === chip.id ? onboardingTokens.activeBg : '#fff', color: onboardingTokens.textMain, fontWeight: 800 }}>
              {chip.label}<small style={{ display: 'block', marginTop: 4, color: onboardingTokens.textMuted, fontWeight: 600 }}>{chip.helper}</small>
            </button>
          ))}
        </div>
        {usesMedicationFields ? (
          <>
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>약품 검색</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input aria-label="약품 검색" type="search" placeholder="예: 고날, 세트로, 오비드렐" value={medicationQuery} onChange={(event) => setMedicationQuery(event.target.value)} style={inputStyle} />
                <button type="button" onClick={normalizeMedication} disabled={normalizing || !medicationQuery.trim()} style={{ ...smallButtonStyle, opacity: normalizing || !medicationQuery.trim() ? 0.5 : 1 }}>{normalizing ? '검색 중' : '검색'}</button>
              </div>
            </label>
            {matchedMedication ? <p style={assistNoticeStyle}>입력 보조가 `{matchedMedication.brand_name_ko}`를 찾았어요. 저장 전 직접 확인해 주세요.</p> : null}
            <button type="button" onClick={() => { setMatchedMedication(null); setAssistSource('none'); if (!title.trim()) setTitle(medicationQuery); }} style={{ ...smallButtonStyle, width: '100%', marginBottom: 14 }}>직접 입력하기</button>
          </>
        ) : null}
        <label style={{ display: 'block' }}><span style={labelStyle}>{usesMedicationFields ? '일정 이름' : '방문 일정 이름'}</span><input aria-label="일정 이름" placeholder={usesMedicationFields ? '예: 고날에프 주사' : '예: 병원 방문 / 채혈 검사'} value={title} onChange={(event) => setTitle(event.target.value)} style={inputStyle} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label><span style={labelStyle}>날짜</span><input aria-label="날짜" type="date" value={date} onChange={(event) => setDate(event.target.value)} style={inputStyle} /></label>
          <label><span style={labelStyle}>시간</span><input aria-label="시간" type="time" value={time} onChange={(event) => setTime(event.target.value)} style={inputStyle} /></label>
        </div>
        {usesMedicationFields ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label><span style={labelStyle}>용량 선택 입력</span><input aria-label="용량" placeholder="150" value={dose} onChange={(event) => setDose(event.target.value)} style={inputStyle} /></label>
            <label><span style={labelStyle}>단위 선택 입력</span><input aria-label="단위" placeholder="IU" value={unit} onChange={(event) => setUnit(event.target.value)} style={inputStyle} /></label>
          </div>
        ) : null}
        <label style={{ display: 'block' }}><span style={labelStyle}>선택적 메모</span><textarea aria-label="선택적 메모" placeholder="병원 안내를 그대로 적어두세요. 자동 저장이나 판단에는 쓰지 않습니다." value={optionalMemo} onChange={(event) => setOptionalMemo(event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></label>
      </div>
      {stepDots(step)}
      {error && <p style={errorStyle}>{error}</p>}
      <button type="button" onClick={() => go('first_schedule_confirm')} disabled={!firstScheduleDraft} style={ctaStyle(!firstScheduleDraft)}>확인 단계로</button>
      <button type="button" onClick={() => void submit({ skipFirstSchedule: true })} disabled={saving} style={{ ...backButtonStyle, alignSelf: 'center', margin: '12px 0 0' }}>나중에 할게요</button>
    </div>
  );

  return (
    <div style={screenStyle}>
      <button type="button" onClick={() => go('first_schedule_interview')} style={backButtonStyle}>← 일정 수정</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>저장 전 확인</p>
        <h1 style={titleStyle}>이 일정으로 Home을 시작할게요</h1>
        <p style={leadStyle}>아래 내용은 사용자가 확인한 일정으로만 저장됩니다.</p>
        <section aria-label="첫 일정 확인" style={{ padding: 18, borderRadius: 20, background: '#fff', border: `1px solid ${onboardingTokens.border}`, display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 19 }}>{firstScheduleDraft?.title}</strong>
          <span>{firstScheduleDraft?.type === 'clinic' ? '병원 방문' : firstScheduleDraft?.type === 'injection' ? '주사' : '약 복용'}</span>
          <span>{date} {time}</span>
          {firstScheduleDraft?.dose ? <span>{firstScheduleDraft.dose} {firstScheduleDraft.unit ?? ''}</span> : null}
          {firstScheduleDraft?.optionalMemo ? <small>{firstScheduleDraft.optionalMemo}</small> : null}
          <small>확인 후 저장 · 입력 보조 자동 저장 없음</small>
        </section>
      </div>
      {stepDots(step)}
      {error && <p style={errorStyle}>{error}</p>}
      <button type="button" onClick={() => void submit()} disabled={saving || !firstScheduleDraft} style={ctaStyle(saving || !firstScheduleDraft)}>{saving ? '저장 중...' : '확인하고 저장'}</button>
    </div>
  );
}

const labelStyle = { display: 'block', margin: '0 0 8px', color: '#9B8E86', fontSize: 14, fontWeight: 700 };
const smallButtonStyle = { minHeight: 48, padding: '0 14px', borderRadius: 14, border: `1.5px solid ${onboardingTokens.border}`, background: '#fff', color: onboardingTokens.primary, fontWeight: 800, fontFamily: 'inherit' };
const assistNoticeStyle = { margin: '0 0 12px', padding: '10px 12px', borderRadius: 14, background: '#F3F8F2', color: '#617B5A', fontSize: 13, lineHeight: 1.4 };

function stepDots(activeStep: OnboardingStep) {
  const steps: OnboardingStep[] = ['brand_intro', 'role_selection', 'patient_consent', 'first_schedule_interview', 'first_schedule_confirm'];
  const activeIndex = Math.max(0, steps.indexOf(activeStep));
  return (
    <div aria-label="온보딩 단계" style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '18px 0 4px' }}>
      {steps.map((item, index) => (
        <span key={item} style={{ width: index === activeIndex ? 18 : 6, height: 6, borderRadius: onboardingTokens.radiusPill, background: index === activeIndex ? onboardingTokens.primary : '#E6D9CF' }} />
      ))}
    </div>
  );
}

function toKstIso(date: string, time: string) {
  if (!date || !time) return '';
  const parsed = new Date(`${date}T${time}:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}
