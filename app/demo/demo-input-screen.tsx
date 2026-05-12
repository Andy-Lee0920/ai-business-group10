'use client';

import { useMemo, useState } from 'react';
import { DemoDeviceFrame } from './demo-device-frame';
import styles from './dual-panel-demo.module.css';

const PHOTO_SAMPLE_MEMO = `고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인\n남편은 주사 30분 전에 준비물 확인`;

type StarterRole = 'patient' | 'partner' | 'curious';

type InterviewChip = {
  id: string;
  label: string;
  memo: string;
};

const ROLE_OPTIONS: Array<{ id: StarterRole; label: string; description: string }> = [
  { id: 'patient', label: '환자 본인', description: '내 오늘 할 일을 정리합니다' },
  { id: 'partner', label: '배우자·파트너', description: '도울 수 있는 일을 봅니다' },
  { id: 'curious', label: '아직 알아보는 중', description: '흐름만 가볍게 봅니다' },
];

const ROLE_PROMPTS: Record<StarterRole, { title: string; subtitle: string; chips: InterviewChip[] }> = {
  patient: {
    title: '오늘 병원에서 뭐라고 했나요?',
    subtitle: '정확히 몰라도 기억나는 조각만 눌러주세요.',
    chips: [
      { id: 'injection', label: '밤 9시 주사', memo: '고날에프 225IU 오늘 밤 9시' },
      { id: 'clinic', label: '내일 초음파', memo: '내일 오전 9시 초음파 확인' },
      { id: 'partner', label: '파트너 준비 확인', memo: '남편은 주사 30분 전에 준비물 확인' },
    ],
  },
  partner: {
    title: '지금 도와야 할 일이 있나요?',
    subtitle: '파트너 화면에 필요한 역할만 먼저 고릅니다.',
    chips: [
      { id: 'supplies', label: '주사 준비물 확인', memo: '남편은 주사 30분 전에 준비물 확인' },
      { id: 'time', label: '밤 9시 알림', memo: '고날에프 225IU 오늘 밤 9시' },
      { id: 'visit', label: '내일 병원 동행', memo: '내일 오전 9시 초음파 확인' },
    ],
  },
  curious: {
    title: '어떤 상황을 보고 싶나요?',
    subtitle: '실제 입력 전에도 Fevio가 역할을 나누는 방식을 볼 수 있어요.',
    chips: [
      { id: 'sample-meds', label: '약·주사 예시', memo: '고날에프 225IU 오늘 밤 9시' },
      { id: 'sample-visit', label: '병원 방문 예시', memo: '내일 오전 9시 초음파 확인' },
      { id: 'sample-partner', label: '파트너 역할 예시', memo: '남편은 주사 30분 전에 준비물 확인' },
    ],
  },
};

export function DemoInputScreen({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [role, setRole] = useState<StarterRole | null>(null);
  const [selectedChipIds, setSelectedChipIds] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const activePrompt = role ? ROLE_PROMPTS[role] : null;
  const assembledMemo = useMemo(() => {
    if (!activePrompt) return '';
    return activePrompt.chips
      .filter((chip) => selectedChipIds.includes(chip.id))
      .map((chip) => chip.memo)
      .join('\n');
  }, [activePrompt, selectedChipIds]);
  const submitMemo = memo.trim() || assembledMemo.trim();

  function selectRole(nextRole: StarterRole) {
    setRole(nextRole);
    setSelectedChipIds([]);
  }

  function toggleChip(chipId: string) {
    setSelectedChipIds((current) => (current.includes(chipId) ? current.filter((id) => id !== chipId) : [...current, chipId]));
  }

  function fillSample() {
    setRole('patient');
    setSelectedChipIds(['injection', 'clinic', 'partner']);
    setMemo('');
  }

  return (
    <main className={`${styles.demoShell} ${styles.memoInputShell} ${styles.phoneFunnelShell}`} data-testid="demo-input-screen">
      <DemoDeviceFrame className={styles.singlePhoneFrame} ariaLabel="병원 안내 입력 전화 화면">
        <section className={`${styles.appScreen} ${styles.memoPhoneScreen}`} aria-labelledby="memo-input-title">
          <section className={styles.memoInputCard}>
            <p className={styles.memoInputKicker}>Fevio</p>
            <h1 id="memo-input-title">먼저 누구로 시작할까요?</h1>
            <p>긴 문장을 쓰지 않아도 됩니다. 클릭 몇 번으로 오늘의 케어 화면을 만듭니다.</p>

            <div className={styles.interviewBlock} aria-label="사용자 역할 선택">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.interviewRoleChip} ${role === option.id ? styles.interviewChipActive : ''}`}
                  aria-pressed={role === option.id}
                  onClick={() => selectRole(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>

            {activePrompt ? (
              <section className={styles.interviewQuestionCard} aria-labelledby="interview-question-title">
                <span>다음 질문</span>
                <h2 id="interview-question-title">{activePrompt.title}</h2>
                <p>{activePrompt.subtitle}</p>
                <div className={styles.interviewChipGrid}>
                  {activePrompt.chips.map((chip) => {
                    const selected = selectedChipIds.includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        className={`${styles.interviewAnswerChip} ${selected ? styles.interviewChipActive : ''}`}
                        aria-pressed={selected}
                        onClick={() => toggleChip(chip.id)}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className={styles.interviewSummaryCard} aria-live="polite">
              <span>이렇게 정리됩니다</span>
              <strong>{submitMemo ? submitMemo.split('\n')[0] : '역할을 먼저 선택해주세요'}</strong>
              {submitMemo ? <small>{submitMemo.split('\n').slice(1).join(' · ') || '추가 선택을 눌러도 됩니다'}</small> : <small>환자 본인, 파트너, 관심 단계에 따라 질문이 달라집니다.</small>}
            </section>

            <details className={styles.manualMemoDetails}>
              <summary>병원 안내를 직접 붙여넣기</summary>
              <label className={styles.memoTextareaLabel} htmlFor="clinic-memo-input">
                병원 안내 메모
              </label>
              <textarea
                id="clinic-memo-input"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder={'고날에프 225IU 오늘 밤 9시\n내일 오전 9시 초음파 확인'}
                rows={4}
              />
            </details>

            <div className={styles.memoInputActions}>
              <button type="button" className={styles.photoSampleButton} onClick={fillSample}>
                예시 넣기
              </button>
              <button type="button" className={styles.submitMemoButton} disabled={!submitMemo} onClick={() => onSubmit(submitMemo)}>
                케어 화면 만들기
              </button>
            </div>
          </section>
        </section>
      </DemoDeviceFrame>
    </main>
  );
}
