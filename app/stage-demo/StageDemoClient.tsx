'use client';
import { useState } from 'react';
import Link from 'next/link';

type TreatmentStep = 'injection' | 'retrieval' | 'fertilization' | 'transfer' | 'wait' | 'result';

const STEPS: Array<{ key: TreatmentStep; label: string; title: string; detail: string; action: string }> = [
  {
    key: 'injection',
    label: '주사',
    title: '주사 일정 확인',
    detail: '약 이름, 용량, 예정 시간을 사용자가 확인한 뒤 오늘 실행 카드로 고정합니다.',
    action: '오늘 홈에서 가장 가까운 주사 시간을 먼저 확인합니다.',
  },
  {
    key: 'retrieval',
    label: '채취',
    title: '채취 전후 일정 정리',
    detail: '방문 시간, 금식 여부, 보호자 동행처럼 병원에서 받은 실행 지시만 남깁니다.',
    action: '진료 후 변경된 방문 시간은 병원 후 업데이트에 기록합니다.',
  },
  {
    key: 'fertilization',
    label: '수정 확인',
    title: '결과 안내 보관',
    detail: '결과 수치나 판단을 대신하지 않고, 병원 안내를 다시 확인할 수 있게 보관합니다.',
    action: '확인 필요한 안내는 공유 기록에 남겨 반복 확인을 줄입니다.',
  },
  {
    key: 'transfer',
    label: '이식',
    title: '이식일 준비',
    detail: '이식 시간, 복약, 방문 준비물처럼 누락되기 쉬운 행동을 일정으로 분리합니다.',
    action: '파트너에게는 도움 행동만 읽기 전용으로 전달합니다.',
  },
  {
    key: 'wait',
    label: '대기',
    title: '대기 기간 실행 유지',
    detail: '검사 전까지 필요한 복약과 병원 안내만 조용히 유지합니다.',
    action: '감정 평가 대신 오늘 확인할 실행 항목을 낮은 밀도로 보여줍니다.',
  },
  {
    key: 'result',
    label: '결과 확인',
    title: '결과 후 다음 안내 연결',
    detail: '결과 해석은 병원 영역으로 두고, 다음 방문과 추가 지시를 일정으로 바꿉니다.',
    action: '다음 진료 일정과 변경된 약을 확인한 뒤 홈에 반영합니다.',
  },
];

export function StageDemoClient() {
  const [selected, setSelected] = useState<TreatmentStep>('injection');
  const current = STEPS.find((step) => step.key === selected) ?? STEPS[0];

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <p style={eyebrowStyle}>시술 단계 확인</p>
        <h1 style={titleStyle}>병원에서 확인한 단계만 실행 일정으로 바꿉니다</h1>
        <p style={leadStyle}>Fevio는 배아 상태를 꾸미거나 판단하지 않습니다. 사용자가 병원에서 들은 안내를 오늘 할 일, 변경 기록, 파트너 도움 행동으로 정리합니다.</p>
      </header>

      <nav aria-label="시술 단계" style={stepNavStyle}>
        {STEPS.map((step) => (
          <button
            key={step.key}
            type="button"
            aria-pressed={selected === step.key}
            onClick={() => setSelected(step.key)}
            style={selected === step.key ? activeStepStyle : stepButtonStyle}
          >
            {step.label}
          </button>
        ))}
      </nav>

      <section aria-labelledby="selected-stage-title" style={cardStyle}>
        <span style={cardEyebrowStyle}>현재 확인할 운영 항목</span>
        <h2 id="selected-stage-title" style={cardTitleStyle}>{current.title}</h2>
        <p style={cardBodyStyle}>{current.detail}</p>
        <div style={actionBoxStyle}>{current.action}</div>
      </section>

      <section aria-label="단계별 운영 원칙" style={gridStyle}>
        <Principle title="사용자 확인 우선" body="AI/OCR 후보는 저장 전 사용자가 직접 확인한 항목만 일정이 됩니다." />
        <Principle title="파트너는 도움만" body="원문이나 민감한 판단 대신 오늘 같이 챙길 행동만 전달합니다." />
        <Principle title="기록은 실행 중심" body="투약 완료, 방문 변경, 안내 확인처럼 다시 볼 운영 기록을 우선합니다." />
      </section>

      <Link href="/home" style={homeLinkStyle}>오늘 실행으로 돌아가기</Link>
    </main>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <article style={principleStyle}>
      <strong style={principleTitleStyle}>{title}</strong>
      <p style={principleBodyStyle}>{body}</p>
    </article>
  );
}

const pageStyle = { minHeight: '100dvh', padding: '56px 20px 104px', background: 'var(--slc-bg)', color: 'var(--slc-text)' } as const;
const headerStyle = { display: 'grid', gap: 10, maxWidth: 520, margin: '0 auto 22px' } as const;
const eyebrowStyle = { margin: 0, color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const titleStyle = { margin: 0, fontSize: 30, lineHeight: 1.12, letterSpacing: '-0.03em', fontWeight: 950 } as const;
const leadStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 14, lineHeight: 1.58, fontWeight: 750 } as const;
const stepNavStyle = { display: 'flex', gap: 8, overflowX: 'auto', maxWidth: 520, margin: '0 auto 18px', paddingBottom: 4 } as const;
const stepButtonStyle = { flex: '0 0 auto', minHeight: 38, border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255,255,255,0.82)', color: 'var(--slc-muted)', padding: '0 14px', font: 'inherit', fontSize: 13, fontWeight: 900 } as const;
const activeStepStyle = { ...stepButtonStyle, borderColor: 'var(--slc-coral)', background: 'var(--slc-coral)', color: '#fff' } as const;
const cardStyle = { maxWidth: 520, margin: '0 auto 14px', borderRadius: 24, border: '1px solid var(--slc-border)', background: 'rgba(255,255,255,0.9)', padding: 20, boxShadow: '0 14px 34px rgba(80,50,40,0.07)' } as const;
const cardEyebrowStyle = { color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const cardTitleStyle = { margin: '8px 0 8px', fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.03em', fontWeight: 950 } as const;
const cardBodyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 14, lineHeight: 1.55, fontWeight: 750 } as const;
const actionBoxStyle = { marginTop: 16, borderRadius: 18, background: 'var(--slc-surface-warm)', color: 'var(--slc-text)', padding: '13px 14px', fontSize: 13, fontWeight: 850, lineHeight: 1.5 } as const;
const gridStyle = { display: 'grid', gap: 10, maxWidth: 520, margin: '0 auto 20px' } as const;
const principleStyle = { borderRadius: 18, border: '1px solid var(--slc-border)', background: 'rgba(255,255,255,0.78)', padding: '14px 16px' } as const;
const principleTitleStyle = { display: 'block', color: 'var(--slc-text)', fontSize: 14, fontWeight: 950, marginBottom: 5 } as const;
const principleBodyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.5, fontWeight: 750 } as const;
const homeLinkStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 520, minHeight: 48, margin: '0 auto', borderRadius: 18, background: 'var(--slc-coral)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 950 } as const;
