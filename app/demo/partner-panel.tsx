import { Badge, Card, ConfirmChip, StatusBadge } from '../../src/components/ui';
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

  return (
    <section className={`${styles.appScreen} ${styles.partnerApp} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-partner-panel" aria-label="파트너 화면">
      <Card as="div" className={styles.partnerHero}>
        <Badge className={styles.statePill} tone={scenario.accent}>{scenario.label}</Badge>
        <h3>{partner.role}</h3>
        <p>{partner.status}</p>
      </Card>

      <Card as="div" className={styles.partnerInputMoment}>
        <span className={styles.microLabel}>내가 다시 설명하지 않아도 되는 내용</span>
        <strong>{scenario.patient.inputMoment.answer}</strong>
        <p>{scenario.patient.inputMoment.adaptation}</p>
      </Card>

      <Card as="div" className={styles.liveMirrorCard} data-testid="partner-sync-mirror">
        <span className={styles.microLabel}>Live mirror</span>
        <strong>{syncEvent.target === '파트너 화면' ? '내 화면에서 들어온 업데이트' : '내 화면으로 보내는 중'}</strong>
        <p>{syncEvent.label}</p>
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

function countChecked(items: DemoScenario['partner']['actions'], checked: ReadonlySet<string>) {
  return items.filter((item) => checked.has(item.id)).length;
}
