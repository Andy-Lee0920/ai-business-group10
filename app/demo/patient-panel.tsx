import type { Dispatch } from 'react';
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
  fertilization: { eyebrow: '프라이버시', title: '필요한 일정만 공유', body: '민감한 세부값은 사용자가 직접 선택합니다.', proof: '공유 범위 선택' },
  embryo_culture: { eyebrow: 'Day 업데이트', title: 'Day 1·3·5 상태 변경', body: '업데이트와 공유 범위를 따로 둡니다.', proof: '시간 앵커' },
  embryo_transfer: { eyebrow: '이식 후 루틴', title: '약 루틴과 피검일 고정', body: '반복 약과 검사 날짜만 붙잡습니다.', proof: '루틴 기록' },
  pregnancy_test: { eyebrow: '결과 보호', title: '결과와 다음 일정 분리', body: '공유 범위가 파트너 화면을 바꿉니다.', proof: '해석 금지' },
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
  const visibleCards = patient.utilityCards.slice(0, 3);

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
            <span className={styles.microLabel}>환자 확인 필요</span>
            <strong>파트너가 주사 기록을 남겼어요</strong>
          </div>
          <CtaButton type="button" onClick={() => dispatch({ type: 'CONFIRM_BY_PATIENT', cardId: 'stim-log' })}>최종 확인</CtaButton>
        </Card>
      ) : null}

      <div className={styles.productDeck} aria-label="오늘의 유틸리티">
        {visibleCards.map((card) => (
          <PatientProductCardRenderer key={card.id} card={card} state={state.utilityState[card.id]} role="patient" sharingLevel={state.sharingLevel} dispatch={dispatch} />
        ))}
      </div>
    </section>
  );
}

function PatientProductCardRenderer({
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
  const selectedSharing = String(state?.values?.sharing ?? sharingLevel) as SharingLevel;

  if (card.type === 'timeline' && card.id === 'culture-timeline') {
    return (
      <Card as="div" className={styles.productCard}>
        <span className={styles.microLabel}>배아 배양</span>
        <strong>배아 업데이트</strong>
        <p>Day별 상태만 짧게 붙잡습니다.</p>
        <div className={styles.productTimeline}>
          {(['day1', 'day3', 'day5'] as const).map((day) => (
            <button key={day} type="button" onClick={() => dispatch({ type: 'UPDATE_CARD_VALUE', cardId: card.id, key: day, value: day === 'day5' ? 'active' : 'done', actor: role })}>
              <span>{day.replace('day', 'Day ')}</span>
              <strong>{timelineStatusCopy(String(state?.values?.[day] ?? 'upcoming'))}</strong>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (card.type === 'privacy_control') {
    return (
      <Card as="div" className={styles.productCard}>
        <span className={styles.microLabel}>공유 설정</span>
        <strong>{card.label}</strong>
        <p>{sharingDetail(selectedSharing)}</p>
        <div className={styles.productChipRow}>
          {(['basic', 'care', 'emotional'] as SharingLevel[]).map((level) => (
            <button key={level} type="button" aria-pressed={sharingLevel === level} onClick={() => dispatch({ type: 'SET_SHARING_LEVEL', level, actor: role })}>
              {sharingCopy(level)}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (card.type === 'result_input') {
    const [firstKey] = Object.keys(state?.values ?? { value: '' });
    return (
      <Card as="div" className={styles.productCard}>
        <span className={styles.microLabel}>{inputEyebrow(card.id)}</span>
        <strong>{card.label}</strong>
        <p>{card.value}</p>
        <input
          aria-label={`${card.label} 입력`}
          className={styles.inlineValueInput}
          value={String(state?.values?.[firstKey] ?? '')}
          onChange={(event) => dispatch({ type: 'UPDATE_CARD_VALUE', cardId: card.id, key: firstKey, value: event.target.value, actor: role })}
        />
      </Card>
    );
  }

  if (card.type === 'next_step_planner') {
    return (
      <Card as="div" className={styles.productCard}>
        <span className={styles.microLabel}>결과 이후</span>
        <strong>{card.label}</strong>
        <p>오늘 결정하지 않아도 되는 항목을 나눕니다.</p>
        <div className={styles.productPillList}>
          {[
            ['second_beta', '2차 피검'],
            ['ultrasound', '초음파'],
            ['medication_continue', '약 지속'],
          ].map(([key, label]) => (
            <button key={key} className={styles.productPillAction} type="button" aria-pressed={Boolean(state?.values?.[key])} onClick={() => dispatch({ type: 'UPDATE_CARD_VALUE', cardId: card.id, key, value: !state?.values?.[key], actor: role })}>
              <span>{state?.values?.[key] ? '✓' : '+'}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <button
      aria-pressed={completed}
      className={classNames(styles.productActionRow, completed && styles.isChecked)}
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

function inputEyebrow(cardId: string) {
  if (cardId.includes('hcg')) return '검사 결과';
  if (cardId.includes('culture')) return '결과 기록';
  if (cardId.includes('transfer')) return '이식 요약';
  return '입력';
}

function timelineStatusCopy(value: string) {
  if (value === 'done') return '완료';
  if (value === 'active') return '진행 중';
  return '예정';
}

function sharingCopy(level: SharingLevel) {
  if (level === 'basic') return '일정만';
  if (level === 'emotional') return '감정까지';
  return '케어 공유';
}

function sharingDetail(level: SharingLevel) {
  if (level === 'basic') return '파트너는 다음 일정만 봅니다.';
  if (level === 'emotional') return '정서 지원 문구까지 함께 보입니다.';
  return '약·일정·필요한 도움까지 공유합니다.';
}
