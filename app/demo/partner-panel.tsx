import { Badge, Card, ConfirmChip, StatusBadge, classNames } from '../../src/components/ui';
import { PartnerAvatar } from '../../src/design/couple-avatars';
import { getFevioIcon, type FevioIconKey } from '../../src/design/icon-map';
import type { DemoScenario } from './demo-scenarios';
import styles from './dual-panel-demo.module.css';

type PartnerPanelProps = {
  scenario: DemoScenario;
  checked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  careDone: boolean;
  partnerConfirmed: boolean;
  onPartnerConfirmToggle: () => void;
  syncEvent: {
    source: string;
    target: string;
    label: string;
  };
};

type DemoCare = DemoScenario['care'];

const PARTNER_ROLE_HERO: Record<DemoCare, {
  eyebrow: string;
  title: string;
  body: string;
  iconKey: FevioIconKey;
}> = {
  injection: {
    eyebrow: '파트너 역할',
    title: '약 이름과 시간을 함께 확인',
    body: '약 이름, 시간, 용량을 함께 대조하고 완료 후 기록만 확인합니다.',
    iconKey: 'assigned:partner_action',
  },
  clinic: {
    eyebrow: '파트너 역할',
    title: '다음 일정을 함께 기록',
    body: '진료 내용을 함께 듣고 다음 방문일과 질문을 같이 남깁니다.',
    iconKey: 'phase:clinic',
  },
  waiting: {
    eyebrow: '파트너 역할',
    title: '묻기보다 곁에 있기',
    body: '결과를 묻기보다 다음 일정과 컨디션을 조용히 챙깁니다.',
    iconKey: 'phase:waiting',
  },
};

const PARTNER_COPY: Record<DemoCare, { label: string; title: string; body: string; idle: string; done: string }> = {
  injection: {
    label: '공유된 핵심',
    title: '오늘 21:00 고날에프',
    body: '확인할 것은 약 이름, 시간, 준비물입니다.',
    idle: '확인 역할이 열려 있어요',
    done: '완료 확인이 전달됐어요',
  },
  clinic: {
    label: '공유된 핵심',
    title: '오늘 병원 방문',
    body: '이동 시간과 다음 방문일 기록을 함께 챙깁니다.',
    idle: '동행 역할이 열려 있어요',
    done: '방문 체크가 전달됐어요',
  },
  waiting: {
    label: '공유된 핵심',
    title: '결과 대기 중',
    body: '묻지 않고 곁에 있을 행동만 남겼습니다.',
    idle: '조용한 지지 역할이 열려 있어요',
    done: '확인 상태가 전달됐어요',
  },
};

export function PartnerPanel({
  scenario,
  checked,
  onToggle,
  careDone,
  partnerConfirmed,
  onPartnerConfirmToggle,
  syncEvent,
}: PartnerPanelProps) {
  const { partner } = scenario;
  const hero = PARTNER_ROLE_HERO[scenario.care];
  const partnerCopy = PARTNER_COPY[scenario.care];

  return (
    <section className={`${styles.appScreen} ${styles.partnerApp} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-partner-panel" aria-label="파트너 화면">
      <Card as="div" className={classNames(styles.partnerHero, styles[`partnerHero_${scenario.care}`])}>
        <div className={styles.partnerHeroTop}>
          <div className={styles.identityCluster} aria-label="파트너 케어 화면">
            <PartnerAvatar className={styles.roleAvatar} />
            <span className={styles.partnerRoleIcon}>
              <DemoIcon iconKey={hero.iconKey} testId="demo-partner-role-icon" />
            </span>
          </div>
          <Badge className={styles.statePill} tone={scenario.accent}>{scenario.label}</Badge>
        </div>
        <span className={styles.microLabel}>{hero.eyebrow}</span>
        <h3>{partner.role}</h3>
        <p>{hero.body}</p>
        <div className={styles.roleFocusRail}>
          <span>{partner.status}</span>
          <strong>{hero.title}</strong>
        </div>
      </Card>

      <Card as="div" className={styles.partnerInputMoment}>
        <span className={styles.microLabel}>{partnerCopy.label}</span>
        <strong>{partnerCopy.title}</strong>
        <p>{partnerCopy.body}</p>
      </Card>

      <Card as="div" className={styles.liveMirrorCard} data-testid="partner-sync-mirror">
        <span className={styles.microLabel}>내 화면 업데이트</span>
        <strong>{syncEvent.target === '파트너 화면' ? syncEvent.label : hero.title}</strong>
        <p>{syncEvent.target === '파트너 화면' ? '내 화면의 확인 상태가 파트너 역할에 반영됐습니다.' : hero.body}</p>
      </Card>

      <Card as="div" className={styles.presencePulseCard} data-testid="demo-partner-presence-pulse">
        <span aria-hidden="true" />
        <div>
          <small>같이 보고 있어요</small>
          <strong>{careDone ? partnerCopy.done : partnerCopy.idle}</strong>
        </div>
      </Card>

      <Card as="div" className={styles.sharedSyncCard}>
        <div>
          <span className={styles.microLabel}>공유 상태</span>
          <strong>{careDone ? '완료됨' : '같이 확인 중'}</strong>
        </div>
        <div className={styles.syncActions}>
          {careDone ? <StatusBadge state="done">완료됨</StatusBadge> : <StatusBadge state="shared">공유중</StatusBadge>}
          <ConfirmChip selected={partnerConfirmed} tone={scenario.accent} onClick={onPartnerConfirmToggle}>
            확인 완료
          </ConfirmChip>
        </div>
      </Card>

      <div className={styles.coreRail} aria-label="공유 상태">
        {scenario.coreTools.map((item) => (
          <button className={styles.coreTool} key={item.id} type="button">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>

      <Card as="div" className={styles.contextStrip}>
        {partner.sharedContext.map((item) => (
          <div key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </Card>

      <Card as="div" className={styles.utilityCard}>
        <div className={styles.cardTitleRow}>
          <h4>도움 행동</h4>
          <span>{countChecked(partner.actions, checked)}/{partner.actions.length}</span>
        </div>
        <div className={styles.actionStack}>
          {partner.actions.map((item) => {
            const selected = checked.has(item.id);
            return (
              <button
                aria-pressed={selected}
                className={`${styles.actionRow} ${selected ? styles.isChecked : ''}`}
                key={item.id}
                onClick={() => onToggle(item.id)}
                type="button"
              >
                <span>{selected ? '✓' : ''}</span>
                <strong>{item.label}</strong>
              </button>
            );
          })}
        </div>
      </Card>

      <Card as="div" className={styles.avoidCard}>
        <h4>오늘 피하기</h4>
        <div className={styles.chipRow}>
          {partner.avoid.map((item) => (
            <span key={item.id}>{item.label}</span>
          ))}
        </div>
      </Card>

      <div className={styles.partnerToolGrid}>
        {partner.quickTools.map((item) => (
          <button className={styles.toolButton} key={item.id} type="button">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function DemoIcon({ iconKey, testId }: { iconKey: FevioIconKey; testId: string }) {
  const spec = getFevioIcon(iconKey);
  const Icon = spec.icon;
  return <Icon aria-hidden="true" data-testid={testId} focusable="false" size={spec.size} strokeWidth={2.25} />;
}

function countChecked(items: DemoScenario['partner']['actions'], checked: ReadonlySet<string>) {
  return items.filter((item) => checked.has(item.id)).length;
}
