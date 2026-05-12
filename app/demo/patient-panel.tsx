import type { CSSProperties } from 'react';
import { Badge, Card, ConfirmChip, CtaButton, StatusBadge, classNames } from '../../src/components/ui';
import { PrimaryUserAvatar } from '../../src/design/couple-avatars';
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
    eyebrow: '주사 시간 확인',
    title: '21:00 주사 준비',
    body: '약 이름, 용량, 보관 조건을 파트너와 함께 대조합니다.',
    proof: '확정된 시간 기준',
    iconKey: 'phase:injection',
  },
  clinic: {
    eyebrow: '진료 전 확인',
    title: '질문과 기록 준비',
    body: '검사 일정, 물어볼 질문, 다음 방문일을 한 번에 정리합니다.',
    proof: '진료실 메모',
    iconKey: 'phase:clinic',
  },
  waiting: {
    eyebrow: '결과 대기',
    title: '확인할 것만 남깁니다',
    body: '결과를 재해석하지 않고 다음 일정과 컨디션만 조용히 확인합니다.',
    proof: '알림 최소화',
    iconKey: 'phase:waiting',
  },
};

const SHARE_COPY: Record<DemoCare, { title: string; body: string; shared: string; waiting: string }> = {
  injection: {
    title: '파트너에게는 확인 역할만 보여요',
    body: '약 이름·시간·준비물처럼 같이 대조할 항목만 전달됩니다.',
    shared: '확인할 항목이 정리됐어요',
    waiting: '파트너 확인을 기다리는 중',
  },
  clinic: {
    title: '동행자가 볼 역할이 정리됐어요',
    body: '방문 시간, 질문, 다음 일정 기록처럼 함께 챙길 일만 보입니다.',
    shared: '진료 메모가 공유됐어요',
    waiting: '동행자 역할을 준비 중',
  },
  waiting: {
    title: '필요한 지지만 전달돼요',
    body: '결과를 묻는 대신 다음 일정과 컨디션 확인만 보입니다.',
    shared: '지지 방식이 정리됐어요',
    waiting: '조용한 공유를 준비 중',
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
  const share = SHARE_COPY[scenario.care];

  return (
    <section className={`${styles.appScreen} ${styles[`accent_${scenario.accent}`]}`} data-testid="demo-patient-panel" aria-label="내 화면">
      <Card as="div" className={classNames(styles.phaseHero, styles[`phaseHero_${scenario.care}`])}>
        <div className={styles.phaseHeroTop}>
          <div className={styles.identityCluster} aria-label="내 케어 화면">
            <PrimaryUserAvatar className={styles.roleAvatar} />
            <span className={styles.phaseIconBubble}>
              <DemoIcon iconKey={hero.iconKey} testId="demo-phase-icon" />
            </span>
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
        <span className={styles.microLabel}>파트너에게 보이는 역할</span>
        <strong>{syncEvent.target === '내 화면' ? syncEvent.label : share.title}</strong>
        <p>{syncEvent.target === '내 화면' ? '파트너의 확인 상태가 내 화면에 반영됐습니다.' : share.body}</p>
      </Card>

      <Card as="div" className={styles.presencePulseCard} data-testid="demo-partner-presence-pulse">
        <span aria-hidden="true" />
        <div>
          <small>같이 보고 있어요</small>
          <strong>{partnerConfirmed ? share.shared : share.waiting}</strong>
        </div>
      </Card>

      <Card as="div" className={styles.sharedSyncCard}>
        <div>
          <span className={styles.microLabel}>공유 상태</span>
          <strong>필요한 역할만 공유합니다</strong>
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
