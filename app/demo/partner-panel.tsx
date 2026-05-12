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
  const visibleCards = getVisiblePartnerCards(scenario, state).slice(0, 3);
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

      <Card as="div" className={styles.productCard}>
        <span className={styles.microLabel}>공유 상태</span>
        <strong>{sharingCopy(state.sharingLevel)}</strong>
        <p>{projectionCopy(state.sharingLevel)}</p>
        <div className={styles.productMetaRow}>
          <span>완료된 도움</span>
          <strong>{completedCount}/{visibleCards.length}</strong>
        </div>
      </Card>

      <div className={styles.productDeck} aria-label="파트너 유틸리티">
        {visibleCards.map((card) => (
          <PartnerProductCard key={card.id} card={card} state={state.utilityState[card.id]} dispatch={dispatch} />
        ))}
      </div>

      <Card as="div" className={styles.avoidCard}>
        <h4>오늘 하지 않기</h4>
        <div className={styles.chipRow}>
          {partner.avoid.map((item) => <span key={item.id}>{item.label}</span>)}
        </div>
      </Card>
    </section>
  );
}

function PartnerProductCard({ card, state, dispatch }: { card: UtilityItem; state?: UtilityCardState; dispatch: Dispatch<DemoAction> }) {
  const completed = state?.status === 'completed';

  return (
    <button
      aria-pressed={completed}
      className={classNames(styles.productActionRow, completed && styles.isChecked)}
      type="button"
      onClick={() => dispatch({ type: 'COMPLETE_CARD', cardId: card.id, actor: 'partner' })}
    >
      <span>{completed ? '✓' : ''}</span>
      <strong>{card.label}</strong>
      <small>{partnerCardBody(card)}</small>
      {completed ? <StatusBadge state="done">완료</StatusBadge> : null}
      {card.id === 'stim-log' && completed ? (
        <CtaButton type="button" variant="ghost" onClick={(event) => { event.stopPropagation(); dispatch({ type: 'COMPLETE_CARD', cardId: 'stim-log', actor: 'partner' }); }}>
          환자 확인 대기
        </CtaButton>
      ) : null}
    </button>
  );
}

function partnerCardBody(card: UtilityItem) {
  if (card.id === 'partner-result-status') return '사용자가 공유한 범위만 표시';
  if (card.id === 'partner-do-not-interpret') return '먼저 단정하지 않기';
  return card.value ?? '확인';
}

function sharingCopy(level: DemoState['sharingLevel']) {
  if (level === 'basic') return '일정만 공유 중';
  if (level === 'emotional') return '감정까지 공유 중';
  return '케어 공유 중';
}

function projectionCopy(level: DemoState['sharingLevel']) {
  if (level === 'basic') return '다음 일정과 필요한 행동만 보입니다.';
  if (level === 'emotional') return '정서적 지지 모드까지 열려 있습니다.';
  return '약·일정·도움 행동이 보입니다.';
}
