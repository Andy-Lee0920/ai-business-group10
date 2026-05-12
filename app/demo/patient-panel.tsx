import type { CSSProperties } from 'react';
import { Badge, Card, ConfirmChip, CtaButton, StatusBadge, classNames } from '../../src/components/ui';
import { getFevioIcon, type FevioIconKey } from '../../src/design/icon-map';
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

type DemoCare = DemoScenario['care'];

const PATIENT_PHASE_HERO: Record<DemoCare, {
  eyebrow: string;
  title: string;
  body: string;
  proof: string;
  iconKey: FevioIconKey;
}> = {
  injection: {
    eyebrow: 'critical timing',
    title: '주사는 시간부터 크게 보입니다',
    body: '용량·보관·확인자를 한 화면에 묶어 마지막 순간의 질문을 줄입니다.',
    proof: 'Trigger-level action first',
    iconKey: 'phase:injection',
  },
  clinic: {
    eyebrow: 'doctor briefing',
    title: '진료 브리핑이 먼저 열립니다',
    body: '방문 시간, 검사, 물어볼 질문과 다음 일정 기록을 의사 앞에서 놓치지 않게 고정합니다.',
    proof: 'Questions + next date locked',
    iconKey: 'phase:clinic',
  },
  waiting: {
    eyebrow: 'quiet support',
    title: '기다리는 날은 조용해집니다',
    body: '결과를 새로 해석하지 않고 필수 일정과 부담 없는 체크인만 남깁니다.',
    proof: 'Low-noise mode active',
    iconKey: 'phase:waiting',
  },
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
  const hero = PATIENT_PHASE_HERO[scenario.care];

  return (
    <section className={`${styles.appScreen} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-patient-panel" aria-label="내 화면">
      <Card as="div" className={classNames(styles.phaseHero, styles[`phaseHero_${scenario.care}`])}>
        <div className={styles.phaseHeroTop}>
          <span className={styles.phaseIconBubble}>
            <DemoIcon iconKey={hero.iconKey} testId="demo-phase-icon" />
          </span>
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
            <strong>{patient.phase} · {patient.stage}</strong>
          </div>
          <div className={styles.progressRing} style={{ '--progress': `${patient.progress}%` } as CSSProperties}>
            <span>{patient.progress}%</span>
          </div>
        </div>

        <div className={styles.phaseHeroAction}>
          <CtaButton className={styles.mainAction} type="button">{patient.primaryAction}</CtaButton>
          <small>{hero.proof}</small>
        </div>
      </Card>

      <Card as="div" className={styles.inputMomentCard}>
        <span className={styles.microLabel}>{patient.inputMoment.prompt}</span>
        <strong>{patient.inputMoment.answer}</strong>
        <p>{patient.inputMoment.adaptation}</p>
      </Card>

      <Card as="div" className={styles.liveMirrorCard} data-testid="patient-sync-mirror">
        <span className={styles.microLabel}>공유 반응</span>
        <strong>{syncEvent.target === '내 화면' ? '파트너에서 들어온 업데이트' : '파트너 화면으로 보내는 중'}</strong>
        <p>{syncEvent.label}</p>
      </Card>

      <Card as="div" className={styles.presencePulseCard} data-testid="demo-partner-presence-pulse">
        <span aria-hidden="true" />
        <div>
          <small>같이 보고 있어요</small>
          <strong>{partnerConfirmed ? '파트너 확인이 도착했어요' : '파트너 역할로 이어지는 중'}</strong>
        </div>
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

function DemoIcon({ iconKey, testId }: { iconKey: FevioIconKey; testId: string }) {
  const spec = getFevioIcon(iconKey);
  const Icon = spec.icon;
  return <Icon aria-hidden="true" data-testid={testId} focusable="false" size={spec.size} strokeWidth={2.25} />;
}

function countChecked(items: DemoScenario['patient']['checklist'], checked: ReadonlySet<string>) {
  return items.filter((item) => checked.has(item.id)).length;
}
