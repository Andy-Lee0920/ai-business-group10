import { Badge, Card, ConfirmChip, StatusBadge, classNames } from '../../src/components/ui';
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
    eyebrow: 'partner role',
    title: '확인자는 질문보다 대조합니다',
    body: '약 이름·시간·준비물을 같이 보고, 완료 후 정리만 맡습니다.',
    iconKey: 'assigned:partner_action',
  },
  clinic: {
    eyebrow: 'partner role',
    title: '동행자는 기억을 나눕니다',
    body: '결과를 같이 듣고 다음 방문일을 기록해 환자가 혼자 기억하지 않게 합니다.',
    iconKey: 'phase:clinic',
  },
  waiting: {
    eyebrow: 'partner role',
    title: '기다리는 날은 묻지 않고 곁에 있습니다',
    body: '결과 질문과 성공 사례 공유를 줄이고, 다음 일정만 조용히 확인합니다.',
    iconKey: 'phase:waiting',
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

  return (
    <section className={`${styles.appScreen} ${styles.partnerApp} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-partner-panel" aria-label="파트너 화면">
      <Card as="div" className={classNames(styles.partnerHero, styles[`partnerHero_${scenario.care}`])}>
        <div className={styles.partnerHeroTop}>
          <span className={styles.partnerRoleIcon}>
            <DemoIcon iconKey={hero.iconKey} testId="demo-partner-role-icon" />
          </span>
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
        <span className={styles.microLabel}>내가 다시 설명하지 않아도 되는 내용</span>
        <strong>{scenario.patient.inputMoment.answer}</strong>
        <p>{scenario.patient.inputMoment.adaptation}</p>
      </Card>

      <Card as="div" className={styles.liveMirrorCard} data-testid="partner-sync-mirror">
        <span className={styles.microLabel}>공유 반응</span>
        <strong>{syncEvent.target === '파트너 화면' ? '내 화면에서 들어온 업데이트' : '내 화면으로 보내는 중'}</strong>
        <p>{syncEvent.label}</p>
      </Card>

      <Card as="div" className={styles.presencePulseCard} data-testid="demo-partner-presence-pulse">
        <span aria-hidden="true" />
        <div>
          <small>같이 보고 있어요</small>
          <strong>{careDone ? '내 화면의 완료가 도착했어요' : '내 역할이 열려 있어요'}</strong>
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
