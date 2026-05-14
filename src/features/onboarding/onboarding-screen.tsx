'use client';
import { useMemo, useState } from 'react';
import { RoleButton, backButtonStyle, checkStyle, ctaStyle, errorStyle, inputStyle, leadStyle, screenStyle, titleStyle } from './onboarding-ui';
import { useRouter } from 'next/navigation';

type Role = 'patient' | 'partner';

type Step = 'role' | 'partner_code';

interface Props {
  inviteCode?: string;
}

const PATIENT_CONSENTS = [
  'Fevio는 의료 판단을 하지 않으며, 병원에서 받은 처방과 직접 입력한 일정만 기록합니다.',
  '약명, 시간, 완료 여부, 병원 방문 일정이 저장될 수 있음을 이해했습니다.',
  '파트너를 연결하면 오늘 일정과 완료 상태가 read-only로 공유될 수 있음을 이해했습니다.',
] as const;

const PARTNER_CONSENTS = [
  'Fevio는 의료 판단을 하지 않으며, 치료자의 입력 정보를 read-only로 보여줍니다.',
  '나는 처방을 수정하거나 의료적 판단을 대신하지 않습니다.',
  '치료자가 공유한 오늘 일정과 완료 상태만 확인할 수 있음을 이해했습니다.',
] as const;

export function OnboardingScreen({ inviteCode }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [inputCode, setInputCode] = useState(inviteCode ?? '');
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('role');

  const consentItems = role === 'partner' ? PARTNER_CONSENTS : PATIENT_CONSENTS;
  const allAccepted = useMemo(
    () => consentItems.every((_, index) => accepted[index]),
    [accepted, consentItems],
  );

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    setAccepted({});
    setError(null);
  };

  const proceed = async () => {
    if (!role || !allAccepted) return;
    if (role === 'partner' && !inputCode.trim()) {
      setStep('partner_code');
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, inviteCode: role === 'partner' ? inputCode.trim() : undefined }),
    });
    const data = await res.json() as { ok?: boolean; error?: string; role?: Role };
    setSaving(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? '온보딩 저장에 실패했습니다.');
      return;
    }
    router.replace(data.role === 'partner' ? '/partner' : '/home');
  };

  if (step === 'partner_code') return (
    <div style={screenStyle}>
      <button type="button" onClick={() => setStep('role')} style={backButtonStyle}>← 역할 선택</button>
      <h1 style={titleStyle}>초대 코드 입력</h1>
      <p style={leadStyle}>치료자가 공유한 초대 코드를 입력하면 read-only 상태 보기에 연결됩니다.</p>
      <input
        aria-label="초대 코드"
        placeholder="초대 코드"
        value={inputCode}
        onChange={(event) => setInputCode(event.target.value)}
        style={inputStyle}
      />
      {error && <p style={errorStyle}>{error}</p>}
      <button
        type="button"
        onClick={proceed}
        disabled={saving || !inputCode.trim()}
        style={ctaStyle(saving || !inputCode.trim())}
      >
        {saving ? '연결 중...' : '동의하고 연결하기'}
      </button>
    </div>
  );

  return (
    <div style={screenStyle}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontSize: 13, fontWeight: 800 }}>Fevio SLC</p>
        <h1 style={titleStyle}>어떤 역할로 시작하시나요?</h1>
        <p style={leadStyle}>오늘 일정 확인, 완료 기록, 병원 변경 반영에 필요한 최소 동의만 확인합니다.</p>

        <RoleButton
          active={role === 'patient'}
          title="나는 치료를 받고 있어요"
          description="오늘 일정 확인, 완료 기록, 변경 반영"
          onClick={() => selectRole('patient')}
        />
        <RoleButton
          active={role === 'partner'}
          title="나는 파트너예요"
          description="공유된 오늘 상태를 읽기 전용으로 확인"
          onClick={() => selectRole('partner')}
        />

        {role && (
          <section aria-label="Fevio 민감정보 동의" style={{ marginTop: 22, display: 'grid', gap: 10 }}>
            {consentItems.map((label, index) => (
              <label key={label} style={checkStyle}>
                <input
                  type="checkbox"
                  checked={accepted[index] === true}
                  onChange={(event) => setAccepted((prev) => ({ ...prev, [index]: event.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--slc-coral)', flex: '0 0 auto' }}
                />
                <span>{label}</span>
              </label>
            ))}
          </section>
        )}
      </div>

      {error && <p style={errorStyle}>{error}</p>}
      <button
        type="button"
        onClick={proceed}
        disabled={!role || !allAccepted || saving}
        style={ctaStyle(!role || !allAccepted || saving)}
      >
        {saving ? '저장 중...' : role === 'partner' ? '동의하고 연결하기' : '동의하고 시작하기'}
      </button>
    </div>
  );
}
