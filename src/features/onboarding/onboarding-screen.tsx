'use client';
import { useMemo, useState } from 'react';
import { RoleButton, backButtonStyle, checkStyle, ctaStyle, errorStyle, inputStyle, leadStyle, screenStyle, titleStyle } from './onboarding-ui';
import { useRouter } from 'next/navigation';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';

type Role = 'patient' | 'partner';

type Step = 'welcome' | 'role' | 'consent';

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
  const [role, setRole] = useState<Role | null>(inviteCode ? 'partner' : null);
  const [inputCode, setInputCode] = useState(inviteCode ?? '');
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('welcome');

  const consentItems = role === 'partner' ? PARTNER_CONSENTS : PATIENT_CONSENTS;
  const allAccepted = useMemo(
    () => Boolean(role) && consentItems.every((_, index) => accepted[index] === true),
    [accepted, consentItems, role],
  );
  const partnerCodeMissing = role === 'partner' && !inputCode.trim();

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    setAccepted({});
    setError(null);
  };

  const proceed = async () => {
    if (!role || !allAccepted || partnerCodeMissing) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, inviteCode: role === 'partner' ? inputCode.trim() : undefined }),
      });
      const data = await res.json() as { ok?: boolean; role?: Role };
      if (!res.ok || !data.ok) {
        setError(SLC_SAFE_COPY.onboardingSaveFailed);
        return;
      }
      router.replace(data.role === 'partner' ? '/partner' : '/home');
    } catch {
      setError(SLC_SAFE_COPY.onboardingSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'welcome') return (
    <div style={screenStyle}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontSize: 13, fontWeight: 800 }}>Fevio</p>
        <h1 style={titleStyle}>Fevio가 병원 안내를 오늘 할 일로 정리해 드릴게요</h1>
        <p style={leadStyle}>처음에는 역할과 필요한 동의만 확인합니다. 병원 안내와 완료 기록은 사용자가 직접 확인한 내용만 저장됩니다.</p>
        <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
          {['오늘 일정 확인', '주사·복용 완료 기록', '파트너 읽기 전용 공유'].map((label) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: 16, background: '#fff', border: '1.5px solid #F0EDE8', color: '#6B5E55', fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => setStep('role')} style={ctaStyle(false)}>시작하기</button>
    </div>
  );

  if (step === 'role') return (
    <div style={screenStyle}>
      <button type="button" onClick={() => setStep('welcome')} style={backButtonStyle}>← 처음으로</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontSize: 13, fontWeight: 800 }}>역할 선택</p>
        <h1 style={titleStyle}>어떤 역할로 시작하시나요?</h1>
        <p style={leadStyle}>역할에 따라 오늘 보이는 화면과 공유 범위가 달라집니다.</p>

        <RoleButton
          active={role === 'patient'}
          title="나는 치료를 받고 있어요"
          description="오늘 일정 확인, 완료 기록, 병원 변경 반영"
          onClick={() => selectRole('patient')}
        />
        <RoleButton
          active={role === 'partner'}
          title="나는 파트너예요"
          description="공유된 오늘 상태를 읽기 전용으로 확인"
          onClick={() => selectRole('partner')}
        />
      </div>
      <button type="button" onClick={() => setStep('consent')} disabled={!role} style={ctaStyle(!role)}>다음</button>
    </div>
  );

  return (
    <div style={screenStyle}>
      <button type="button" onClick={() => setStep('role')} style={backButtonStyle}>← 역할 선택</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: 'var(--slc-coral)', fontSize: 13, fontWeight: 800 }}>동의 확인</p>
        <h1 style={titleStyle}>Fevio 민감정보 동의</h1>
        <p style={leadStyle}>아래 항목은 직접 체크해야 시작할 수 있습니다.</p>

        {role === 'partner' && (
          <label style={{ display: 'block', marginTop: 18 }}>
            <span style={{ display: 'block', marginBottom: 8, color: '#9B8E86', fontSize: 14 }}>초대 코드</span>
            <input
              aria-label="초대 코드"
              placeholder="치료자가 공유한 초대 코드"
              value={inputCode}
              onChange={(event) => setInputCode(event.target.value)}
              style={inputStyle}
            />
          </label>
        )}

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
      </div>

      {error && <p style={errorStyle}>{error}</p>}
      <button
        type="button"
        onClick={proceed}
        disabled={!role || !allAccepted || partnerCodeMissing || saving}
        style={ctaStyle(!role || !allAccepted || partnerCodeMissing || saving)}
      >
        {saving ? '저장 중...' : role === 'partner' ? '동의하고 연결하기' : '동의하고 시작하기'}
      </button>
    </div>
  );
}
