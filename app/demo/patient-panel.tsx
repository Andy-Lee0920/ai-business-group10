import type { CSSProperties } from 'react';
import { Badge, Card, ConfirmChip, CtaButton, StatusBadge } from '../../src/components/ui';
import type { DemoScenario } from './demo-scenarios';
import styles from './dual-panel-demo.module.css';

type PatientPanelProps = {
  scenario: DemoScenario;
  checked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  careDone: boolean;
  onCareDoneToggle: () => void;
  partnerConfirmed: boolean;
  syncEvent: {
    source: string;
    target: string;
    label: string;
  };
};

export function PatientPanel({
  scenario,
  checked,
  onToggle,
  careDone,
  onCareDoneToggle,
  partnerConfirmed,
  syncEvent,
}: PatientPanelProps) {
  const { patient } = scenario;

  return (
    <section className={`${styles.appScreen} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-patient-panel" aria-label="내 화면">
      <Card as="div" className={styles.stageCard}>
        <div>
          <span className={styles.microLabel}>현재 단계</span>
          <strong>{patient.stage}</strong>
          <p>{patient.phase}</p>
        </div>
        <div className={styles.progressRing} style={{ '--progress': `${patient.progress}%` } as CSSProperties}>
          <span>{patient.progress}%</span>
        </div>
      </Card>

      <Card as="div" className={styles.primaryCard}>
        <Badge className={styles.statePill} tone={scenario.accent}>{scenario.label}</Badge>
        <h3>{patient.headline}</h3>
        <CtaButton className={styles.mainAction} type="button">{patient.primaryAction}</CtaButton>
      </Card>

      <Card as="div" className={styles.inputMomentCard}>
        <span className={styles.microLabel}>{patient.inputMoment.prompt}</span>
        <strong>{patient.inputMoment.answer}</strong>
        <p>{patient.inputMoment.adaptation}</p>
      </Card>

      <Card as="div" className={styles.liveMirrorCard} data-testid="patient-sync-mirror">
        <span className={styles.microLabel}>Live mirror</span>
        <strong>{syncEvent.target === '내 화면' ? '파트너에서 들어온 업데이트' : '파트너 화면으로 보내는 중'}</strong>
        <p>{syncEvent.label}</p>
      </Card>

      <Card as="div" className={styles.sharedSyncCard}>
        <div>
          <span className={styles.microLabel}>공유 상태</span>
          <strong>다시 설명하지 않아도 돼요</strong>
        </div>
        <div className={styles.syncActions}>
          <ConfirmChip selected={careDone} tone={scenario.accent} onClick={onCareDoneToggle}>
            오늘 항목 완료
          </ConfirmChip>
          {partnerConfirmed ? <StatusBadge state="synced">파트너가 확인했어요</StatusBadge> : <StatusBadge state="shared">파트너와 공유중</StatusBadge>}
        </div>
      </Card>

      <div className={styles.coreRail} aria-label="v1 필수 기능">
        {scenario.coreTools.map((item) => (
          <button className={styles.coreTool} key={item.id} type="button">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>

      <div className={styles.metricGrid}>
        {patient.nowStack.map((item) => (
          <Card as="div" className={`${styles.metricCard} ${styles[`tone_${item.tone ?? 'neutral'}`]}`} key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.meta ? <small>{item.meta}</small> : null}
          </Card>
        ))}
      </div>

      <Card as="div" className={styles.utilityCard}>
        <div className={styles.cardTitleRow}>
          <h4>오늘 체크</h4>
          <span>{countChecked(patient.checklist, checked)}/{patient.checklist.length}</span>
        </div>
        <div className={styles.checkGrid}>
          {patient.checklist.map((item) => {
            const selected = checked.has(item.id);
            return (
              <button
                aria-pressed={selected}
                className={`${styles.checkTile} ${selected ? styles.isChecked : ''}`}
                key={item.id}
                onClick={() => onToggle(item.id)}
                type="button"
              >
                <span>{selected ? '✓' : ''}</span>
                <strong>{item.label}</strong>
                {item.meta ? <small>{item.meta}</small> : null}
              </button>
            );
          })}
        </div>
      </Card>

      <Card as="div" className={styles.timelineCard}>
        {patient.timeline.map((item) => (
          <div className={styles.timelineItem} key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </Card>

      <div className={styles.toolDock}>
        {patient.quickTools.map((item) => (
          <button className={styles.toolButton} key={item.id} type="button">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function countChecked(items: DemoScenario['patient']['checklist'], checked: ReadonlySet<string>) {
  return items.filter((item) => checked.has(item.id)).length;
}
