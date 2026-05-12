import type { Dispatch } from 'react';
import { Badge, Card, CtaButton, StatusBadge, classNames } from '../../src/components/ui';
import { PartnerAvatar } from '../../src/design/couple-avatars';
import type { DemoScenario, IvfStage, UtilityItem } from './demo-scenarios';
import { getVisiblePartnerCards, type DemoAction, type DemoState, type UtilityCardState } from './demo-state';
import styles from './dual-panel-demo.module.css';

type PartnerPanelProps = {
  scenario: DemoScenario;
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
};

export const RESULT_SHARED_STATUS_LABEL = 'ResultSharedStatus';
export const DO_NOT_INTERPRET_LABEL = 'DoNotInterpretCard';

export const PARTNER_ROLE_HERO: Record<IvfStage, { eyebrow: string; title: string; body: string }> = {
  baseline_testing: { eyebrow: '파트너 역할', title: '질문을 함께 보기', body: '일정과 질문 목록만 확인합니다.' },
  ovarian_stimulation: { eyebrow: '파트너 역할', title: '약 이름과 준비물 확인', body: '기록 후 환자 최종 확인을 기다립니다.' },
  egg_retrieval: { eyebrow: '파트너 역할', title: '귀가와 회복 지원', body: '도움 행동과 상태 확인만 남깁니다.' },
  fertilization: { eyebrow: '파트너 역할', title: '공유된 일정만 보기', body: '사용자가 연 범위 안에서만 보입니다.' },
  embryo_culture: { eyebrow: '파트너 역할', title: '먼저 묻지 않기', body: '다음 알림과 조용한 행동만 보입니다.' },
  embryo_transfer: { eyebrow: '파트너 역할', title: '약 시간 함께 확인', body: '루틴 보조와 휴식 환경을 챙깁니다.' },
  pregnancy_test: { eyebrow: '파트너 역할', title: '수치 해석하지 않기', body: '공유 여부와 다음 일정만 확인합니다.' },
};

export function PartnerPanel({ scenario, state, dispatch }: PartnerPanelProps) {
  const partner = scenario.partner;
  const hero = PARTNER_ROLE_HERO[scenario.stage];
  const visibleCards = getVisiblePartnerCards(scenario, state);
  const completedCount = visibleCards.filter((card) => state.utilityState[card.id]?.status === 'completed').length;

  return (
    <section className={`${styles.appScreen} ${styles.partnerApp} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-partner-panel" aria-label="파트너 화면">
      <Card as="div" className={classNames(styles.partnerHero, styles[`partnerHero_${scenario.accent}`])}>
        <div className={styles.partnerHeroTop}>
          <div className={styles.identityCluster} aria-label="파트너 케어 화면">
            <PartnerAvatar className={styles.roleAvatar} />
            <span className={styles.partnerRoleIcon}>{scenario.index}</span>
          </div>
          <Badge className={styles.statePill} tone={scenario.accent}>{scenario.label}</Badge>
        </div>
        <span className={styles.microLabel}>{hero.eyebrow}</span>
        <h3>{hero.title}</h3>
        <p>{hero.body}</p>
        <div className={styles.roleFocusRail}>
          <span>{partner.status}</span>
          <strong>{partner.role}</strong>
        </div>
      </Card>

      <Card as="div" className={styles.contextStrip}>
        {partner.sharedContext.map((item) => (
          <div key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </Card>

      <Card as="div" className={styles.sharedSyncCard}>
        <div>
          <span className={styles.microLabel}>Permission projection</span>
          <strong>{sharingCopy(state.sharingLevel)}</strong>
        </div>
        <StatusBadge state="shared">{visibleCards.length} cards visible</StatusBadge>
      </Card>

      <Card as="div" className={styles.utilityCard}>
        <div className={styles.cardTitleRow}>
          <h4>Partner utility</h4>
          <span>{completedCount}/{visibleCards.length}</span>
        </div>
        <div className={styles.actionStack}>
          {visibleCards.map((card) => (
            <PartnerUtilityCard key={card.id} card={card} state={state.utilityState[card.id]} dispatch={dispatch} />
          ))}
        </div>
      </Card>

      <Card as="div" className={styles.avoidCard}>
        <h4>오늘 피하기</h4>
        <div className={styles.chipRow}>
          {partner.avoid.map((item) => <span key={item.id}>{item.label}</span>)}
        </div>
      </Card>
    </section>
  );
}

function PartnerUtilityCard({ card, state, dispatch }: { card: UtilityItem; state?: UtilityCardState; dispatch: Dispatch<DemoAction> }) {
  const completed = state?.status === 'completed';
  const isResultStatus = card.label === RESULT_SHARED_STATUS_LABEL;
  const isDoNotInterpret = card.label === DO_NOT_INTERPRET_LABEL;

  return (
    <button
      aria-pressed={completed}
      className={classNames(styles.actionRow, completed && styles.isChecked)}
      type="button"
      onClick={() => dispatch({ type: 'COMPLETE_CARD', cardId: card.id, actor: 'partner' })}
    >
      <span>{completed ? '✓' : ''}</span>
      <strong>{card.label}</strong>
      <small>{partnerCardBody(card, isResultStatus, isDoNotInterpret)}</small>
      {completed ? <StatusBadge state="done">완료</StatusBadge> : null}
      {card.id === 'stim-log' && completed ? (
        <CtaButton type="button" variant="ghost" onClick={(event) => { event.stopPropagation(); dispatch({ type: 'COMPLETE_CARD', cardId: 'stim-log', actor: 'partner' }); }}>
          환자 확인 대기
        </CtaButton>
      ) : null}
    </button>
  );
}

function partnerCardBody(card: UtilityItem, isResultStatus: boolean, isDoNotInterpret: boolean) {
  if (isResultStatus) return '사용자가 공유한 범위만 표시';
  if (isDoNotInterpret) return '먼저 단정하지 않기';
  return card.value ?? '확인';
}

function sharingCopy(level: DemoState['sharingLevel']) {
  if (level === 'basic') return '기본 공유';
  if (level === 'emotional') return '감정 공유';
  return '케어 공유';
}
