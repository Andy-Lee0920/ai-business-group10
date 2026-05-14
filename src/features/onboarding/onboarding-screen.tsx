'use client';
import { useMemo, useState } from 'react';
import { RoleButton, backButtonStyle, checkStyle, ctaStyle, errorStyle, inputStyle, leadStyle, onboardingTokens, screenStyle, titleStyle } from './onboarding-ui';
import { useRouter } from 'next/navigation';
import { SLC_SAFE_COPY } from '../../domain/slc-copy';

type Role = 'patient' | 'partner';

type Step = 'welcome' | 'role' | 'consent';

interface Props {
  inviteCode?: string;
}

const PATIENT_CONSENTS = [
  '개인정보 수집 동의 — 필수 서비스 제공을 위해 사용돼요.',
  '민감정보 처리 동의 — 치료 관련 정보를 안전하게 처리해요.',
] as const;

const PARTNER_CONSENTS = [
  '개인정보 수집 동의 — 파트너 연결을 위해 사용돼요.',
  '민감정보 처리 동의 — 공유된 오늘 일정만 읽기 전용으로 확인해요.',
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
      router.replace('/home');
    } catch {
      setError(SLC_SAFE_COPY.onboardingSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'welcome') return (
    <div style={screenStyle}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>Fevio</p>
        <div aria-hidden style={{ display: 'grid', placeItems: 'center', width: 132, height: 132, borderRadius: onboardingTokens.radiusPill, margin: '0 auto 28px', background: 'radial-gradient(circle, #FCE1D8, #FFF7EF 70%)', fontSize: 64 }}>🌿♡</div>
        <h1 style={{ ...titleStyle, textAlign: 'center', fontFamily: 'Georgia, serif', fontSize: 36 }}>Fevio</h1>
        <p style={{ ...leadStyle, textAlign: 'center', fontSize: 18, color: onboardingTokens.textMain }}>오늘의 주사와 약을 조용히 챙겨드릴게요</p>
        <p style={{ ...leadStyle, textAlign: 'center' }}>여러분의 하루가 더 가볍고 안정될 수 있도록 함께합니다.</p>
        <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
          {['오늘 일정 확인', '주사·복용 완료 기록', '파트너 읽기 전용 공유'].map((label) => (
            <div key={label} style={{ minHeight: 44, padding: '14px 16px', borderRadius: onboardingTokens.radiusCard, background: '#fff', border: `1.5px solid ${onboardingTokens.border}`, color: '#6B5E55', fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>
      </div>
      {stepDots(0)}
      <button type="button" onClick={() => setStep('role')} style={ctaStyle(false)}>시작하기</button>
    </div>
  );

  if (step === 'role') return (
    <div style={screenStyle}>
      <button type="button" onClick={() => setStep('welcome')} style={backButtonStyle}>← 처음으로</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>역할 선택</p>
        <h1 style={titleStyle}>어떤 역할로 시작하시나요?</h1>
        <p style={leadStyle}>역할에 따라 오늘 보이는 화면과 공유 범위가 달라집니다.</p>

        <RoleButton
          active={role === 'patient'}
          icon="♡"
          title="나는 치료를 받고 있어요"
          description="오늘의 주사와 약 복용을 쉽게 관리할 수 있어요."
          onClick={() => selectRole('patient')}
        />
        <RoleButton
          active={role === 'partner'}
          icon="👥"
          title="나는 파트너예요"
          description="소중한 사람의 치료 여정을 함께 응원할 수 있어요."
          onClick={() => selectRole('partner')}
        />
      </div>
      {stepDots(1)}
      <button type="button" onClick={() => setStep('consent')} disabled={!role} style={ctaStyle(!role)}>다음</button>
    </div>
  );

  return (
    <div style={screenStyle}>
      <button type="button" onClick={() => setStep('role')} style={backButtonStyle}>← 역할 선택</button>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px', color: onboardingTokens.primary, fontSize: 13, fontWeight: 800 }}>동의 확인</p>
        <h1 style={titleStyle}>Fevio 민감정보 동의</h1>
        <p style={leadStyle}>아래 항목은 직접 체크해야 시작할 수 있습니다.</p>

        {role === 'partner' && (
          <label style={{ display: 'block', marginTop: 18 }}>
            <span style={{ display: 'block', marginBottom: 8, color: '#9B8E86', fontSize: 14 }}>초대 코드 입력</span>
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
                style={{ width: 18, height: 18, accentColor: onboardingTokens.primary, flex: '0 0 auto' }}
              />
              <span>{label}</span>
            </label>
          ))}
        </section>
      </div>

      {stepDots(2)}
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

function stepDots(activeIndex: number) {
  return (
    <div aria-label="온보딩 단계" style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '18px 0 4px' }}>
      {[0, 1, 2].map((index) => (
        <span key={index} style={{ width: index === activeIndex ? 18 : 6, height: 6, borderRadius: onboardingTokens.radiusPill, background: index === activeIndex ? onboardingTokens.primary : '#E6D9CF' }} />
      ))}
    </div>
  );
}
