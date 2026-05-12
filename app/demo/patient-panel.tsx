import type { CSSProperties, Dispatch } from 'react';
import { Badge, Card, CtaButton, StatusBadge, classNames } from '../../src/components/ui';
import { PrimaryUserAvatar } from '../../src/design/couple-avatars';
import type { DemoScenario, IvfStage, SharingLevel, UtilityItem } from './demo-scenarios';
import type { DemoAction, DemoState, UtilityCardState } from './demo-state';
import styles from './dual-panel-demo.module.css';

type PatientPanelProps = {
  scenario: DemoScenario;
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
};

type PatientHeroCopy = {
  eyebrow: string;
  title: string;
  body: string;
  proof: string;
};

export const PATIENT_PHASE_HERO: Record<IvfStage, PatientHeroCopy> = {
  baseline_testing: { eyebrow: '방문 전 흐름 정리', title: '질문과 검사 결과를 한곳에', body: '오늘 확인할 내용만 짧게 모읍니다.', proof: '기초 상담 준비' },
  ovarian_stimulation: { eyebrow: '주사 실행', title: '21:00 주사 기록', body: '약 이름·시간·기록자를 분리합니다.', proof: '환자 최종 확인 필요' },
  egg_retrieval: { eyebrow: '채취·회복', title: '회복 상태 숫자로 기록', body: '판단 없이 증상 변화만 남깁니다.', proof: '동행 행동 반영' },
  fertilization: { eyebrow: '프라이버시', title: '필요한 일정만 공유', body: '민감한 세부값은 사용자가 직접 선택합니다.', proof: 'permission projection' },
  embryo_culture: { eyebrow: 'Day 업데이트', title: 'Day 1·3·5 상태 변경', body: '업데이트와 공유 범위를 따로 둡니다.', proof: 'timeline state' },
  embryo_transfer: { eyebrow: '이식 후 루틴', title: '약 루틴과 피검일 고정', body: '반복 약과 검사 날짜만 붙잡습니다.', proof: 'routine tracker' },
  pregnancy_test: { eyebrow: '결과 보호', title: '결과와 다음 일정 분리', body: '공유 범위가 파트너 화면을 바꿉니다.', proof: 'no interpretation' },
};

export const SHARE_COPY: Record<IvfStage, { title: string; body: string; shared: string; waiting: string }> = {
  baseline_testing: { title: '질문 목록만 같이 봅니다', body: '파트너는 일정과 질문만 확인합니다.', shared: '준비가 공유됐어요', waiting: '질문 정리 중' },
  ovarian_stimulation: { title: '준비 확인만 전달됩니다', body: '약·시간·준비물 중심으로 보입니다.', shared: '파트너가 준비를 확인했어요', waiting: '파트너 확인 대기' },
  egg_retrieval: { title: '동행 행동이 보입니다', body: '귀가·수분·휴식 준비만 보입니다.', shared: '지원 행동이 기록됐어요', waiting: '지원 준비 중' },
  fertilization: { title: '일정만 공유 중', body: '세부값은 숨기고 알림만 보입니다.', shared: '공유 범위가 반영됐어요', waiting: '필요한 일정만 공유' },
  embryo_culture: { title: '다음 알림 중심', body: '결과 세부는 공유 범위에 따릅니다.', shared: '업데이트가 반영됐어요', waiting: '다음 알림 예정' },
  embryo_transfer: { title: '약 시간과 피검일', body: '루틴 보조에 필요한 내용만 보입니다.', shared: '약 시간이 확인됐어요', waiting: '루틴 확인 대기' },
  pregnancy_test: { title: '결과 공유는 선택', body: '다음 일정만 또는 결과까지 직접 선택합니다.', shared: '공유 범위가 반영됐어요', waiting: '결과 공유 대기' },
};

export function PatientPanel({ scenario, state, dispatch }: PatientPanelProps) {
  const { patient } = scenario;
  const hero = PATIENT_PHASE_HERO[scenario.stage];
  const share = SHARE_COPY[scenario.stage];
  const partnerCompleted = Object.values(state.utilityState).some((card) => card.completedBy === 'partner');
  const stimLog = state.utilityState['stim-log'];

  return (
    <section className={`${styles.appScreen} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-patient-panel" aria-label="내 화면">
      <Card as="div" className={classNames(styles.phaseHero, styles[`phaseHero_${scenario.accent}`])}>
        <div className={styles.phaseHeroTop}>
          <div className={styles.identityCluster} aria-label="내 케어 화면">
            <PrimaryUserAvatar className={styles.roleAvatar} />
            <span className={styles.phaseIconBubble}>{scenario.index}</span>
          </div>
          <Badge className={styles.statePill} tone={scenario.accent}>{scenario.label}</Badge>
        </div>

        <div className={styles.phaseHeroCopy}>
          <span className={styles.microLabel}>{hero.eyebrow}</span>
          <h3>{hero.title}</h3>
          <p>{hero.body}</p>
        </div>

        <div className={styles.phaseHeroStatus}>
          <div>
            <span>{patient.headline}</span>
            <strong>{patient.phase}</strong>
          </div>
          <div className={styles.progressRing} style={{ '--progress': `${patient.progress}%` } as CSSProperties}>
            <span>{patient.progress}%</span>
          </div>
        </div>

        <div className={styles.phaseHeroAction}>
          <CtaButton className={styles.mainAction} type="button" onClick={() => dispatch({ type: 'COMPLETE_CARD', cardId: patient.utilityCards[0]?.id ?? scenario.stage, actor: 'patient' })}>{patient.primaryAction}</CtaButton>
          <small>{hero.proof}</small>
        </div>
      </Card>

      <Card as="div" className={styles.liveMirrorCard} data-testid="patient-sync-mirror">
        <span className={styles.microLabel}>파트너 화면 반영</span>
        <strong>{partnerCompleted ? share.shared : share.title}</strong>
        <p>{stimLog?.completedBy === 'partner' && !stimLog.confirmedByPatient ? '파트너가 기록했어요. 환자 최종 확인이 필요합니다.' : share.body}</p>
      </Card>

      {stimLog?.completedBy === 'partner' && !stimLog.confirmedByPatient ? (
        <Card as="div" className={styles.sharedSyncCard}>
          <div>
            <span className={styles.microLabel}>InjectionLog</span>
            <strong>administered_by ≠ recorded_by</strong>
          </div>
          <CtaButton type="button" onClick={() => dispatch({ type: 'CONFIRM_BY_PATIENT', cardId: 'stim-log' })}>환자 최종 확인</CtaButton>
        </Card>
      ) : null}

      <div className={styles.metricGrid}>
        {patient.nowStack.map((item) => (
          <Card as="div" className={`${styles.metricCard} ${styles[`tone_${item.tone ?? 'neutral'}`]}`} key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Card>
        ))}
      </div>

      <Card as="div" className={styles.utilityCard}>
        <div className={styles.cardTitleRow}>
          <h4>Utility components</h4>
          <span>{state.actionLog.length} events</span>
        </div>
        <div className={styles.actionStack}>
          {patient.utilityCards.map((card) => (
            <UtilityCardRenderer key={card.id} card={card} state={state.utilityState[card.id]} role="patient" sharingLevel={state.sharingLevel} dispatch={dispatch} />
          ))}
        </div>
      </Card>

      <Card as="div" className={styles.timelineCard}>
        {patient.timeline.map((item) => (
          <div className={styles.timelineItem} key={item.id}>
            <span>{item.label}</span>
            <strong>{state.utilityState['culture-timeline']?.values?.[item.id] ?? item.value}</strong>
          </div>
        ))}
      </Card>
    </section>
  );
}

function UtilityCardRenderer({
  card,
  state,
  role,
  sharingLevel,
  dispatch,
}: {
  card: UtilityItem;
  state?: UtilityCardState;
  role: 'patient';
  sharingLevel: SharingLevel;
  dispatch: Dispatch<DemoAction>;
}) {
  const status = state?.status ?? 'idle';
  const completed = status === 'completed';
  const isTimeline = card.type === 'timeline' && card.id === 'culture-timeline';
  const isPrivacy = card.type === 'privacy_control';
  const isResultInput = card.type === 'result_input';
  const selectedSharing = String(state?.values?.sharing ?? sharingLevel);

  if (isTimeline) {
    return (
      <div className={classNames(styles.actionRow, completed && styles.isChecked)}>
        <span>{completed ? '✓' : ''}</span>
        <div>
          <strong>{card.label}</strong>
          <small>{timelineLabel(state)}</small>
          <div className={styles.chipRow}>
            {['day1', 'day3', 'day5'].map((day) => (
              <button key={day} type="button" onClick={() => dispatch({ type: 'UPDATE_CARD_VALUE', cardId: card.id, key: day, value: day === 'day5' ? 'active' : 'done', actor: role })}>
                {day.toUpperCase()} {String(state?.values?.[day] ?? '')}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isPrivacy) {
    return (
      <div className={styles.actionRow}>
        <span>{selectedSharing === 'basic' ? '•' : '✓'}</span>
        <div>
          <strong>{card.label}</strong>
          <small>{sharingCopy(selectedSharing as SharingLevel)}</small>
          <div className={styles.chipRow}>
            {(['basic', 'care', 'emotional'] as SharingLevel[]).map((level) => (
              <button key={level} type="button" aria-pressed={sharingLevel === level} onClick={() => dispatch({ type: 'SET_SHARING_LEVEL', level, actor: role })}>
                {sharingCopy(level)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isResultInput) {
    const [firstKey] = Object.keys(state?.values ?? { value: '' });
    return (
      <div className={styles.actionRow}>
        <span>{completed ? '✓' : ''}</span>
        <div>
          <strong>{card.label}</strong>
          <small>{card.value}</small>
          <input
            aria-label={`${card.label} 입력`}
            className={styles.inlineValueInput}
            value={String(state?.values?.[firstKey] ?? '')}
            onChange={(event) => dispatch({ type: 'UPDATE_CARD_VALUE', cardId: card.id, key: firstKey, value: event.target.value, actor: role })}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      aria-pressed={completed}
      className={classNames(styles.actionRow, completed && styles.isChecked)}
      type="button"
      onClick={() => dispatch({ type: 'COMPLETE_CARD', cardId: card.id, actor: role })}
    >
      <span>{completed ? '✓' : ''}</span>
      <strong>{card.label}</strong>
      <small>{completed ? '기록됨' : card.value}</small>
      {state?.completedBy ? <StatusBadge state="done">{state.completedBy === 'partner' ? '파트너 기록' : '내 기록'}</StatusBadge> : null}
    </button>
  );
}

function timelineLabel(state?: UtilityCardState) {
  return `Day1 ${state?.values?.day1 ?? 'upcoming'} · Day3 ${state?.values?.day3 ?? 'upcoming'} · Day5 ${state?.values?.day5 ?? 'upcoming'}`;
}

function sharingCopy(level: SharingLevel) {
  if (level === 'basic') return '일정만';
  if (level === 'emotional') return '감정까지';
  return '케어 공유';
}
