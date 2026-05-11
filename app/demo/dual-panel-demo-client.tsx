'use client';

import { useMemo, useState } from 'react';
import type { PresentationCareParam } from '../../src/features/adaptive-home/presentation-scenarios';
import { SelectionChip } from '../../src/components/ui';
import { DEMO_ORDER, DEMO_SCENARIOS } from './demo-scenarios';
import { PartnerPanel } from './partner-panel';
import { PatientPanel } from './patient-panel';
import styles from './dual-panel-demo.module.css';

function toggleSet(source: ReadonlySet<string>, id: string) {
  const next = new Set(source);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

type SyncEvent = {
  id: number;
  source: '내 화면' | '파트너 화면';
  target: '내 화면' | '파트너 화면';
  label: string;
};

export function DualPanelDemoClient() {
  const [care, setCare] = useState<PresentationCareParam>('injection');
  const [patientChecks, setPatientChecks] = useState<Record<PresentationCareParam, Set<string>>>(() => ({
    injection: new Set(['wash']),
    clinic: new Set(['card']),
    waiting: new Set(['water']),
  }));
  const [partnerChecks, setPartnerChecks] = useState<Record<PresentationCareParam, Set<string>>>(() => ({
    injection: new Set(['space']),
    clinic: new Set(['route']),
    waiting: new Set(['quiet']),
  }));
  const [sharedSync, setSharedSync] = useState<Record<PresentationCareParam, { careDone: boolean; partnerConfirmed: boolean }>>(() => ({
    injection: { careDone: false, partnerConfirmed: false },
    clinic: { careDone: false, partnerConfirmed: false },
    waiting: { careDone: false, partnerConfirmed: false },
  }));
  const [syncEvent, setSyncEvent] = useState<SyncEvent>(() => ({
    id: 0,
    source: '내 화면',
    target: '파트너 화면',
    label: '확정 카드가 파트너 화면으로 안전하게 투영됩니다',
  }));

  const scenario = DEMO_SCENARIOS[care];
  const activeIndex = useMemo(() => DEMO_ORDER.indexOf(care) + 1, [care]);
  const sync = sharedSync[care];
  const careInputLabels: Record<PresentationCareParam, string> = {
    injection: '주사 준비',
    clinic: '병원 다녀오기',
    waiting: '기다리는 중',
  };

  function publishSync(event: Omit<SyncEvent, 'id'>) {
    setSyncEvent({ ...event, id: Date.now() });
  }

  return (
    <div className={styles.demoShell} data-testid="demo-preview-stage">
      <header className={styles.compactHeader}>
        <div>
          <p className="eyebrow">Dual-view demo</p>
          <h1>내 화면과 파트너 화면이 함께 바뀝니다</h1>
        </div>
        <div className={styles.careInput}>
          <p id="care-input-label">지금은 어떤 날에 가까우세요?</p>
          <div className={styles.compactController} role="group" aria-labelledby="care-input-label">
            {DEMO_ORDER.map((value) => (
              <SelectionChip
                key={value}
                onClick={() => setCare(value)}
                selected={care === value}
                tone={DEMO_SCENARIOS[value].accent}
              >
                {careInputLabels[value]}
              </SelectionChip>
            ))}
          </div>
          <small>오늘 화면을 이렇게 맞췄어요.</small>
        </div>
        <span className={styles.stepBadge}>{activeIndex}/3</span>
      </header>

      <section className={styles.dualPanel} aria-label="내 화면과 파트너 동시 화면" key={care}>
        <article className={styles.panel} data-testid="demo-device-frame" aria-labelledby="patient-panel-title">
          <DeviceChrome />
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>My care</span>
            <h2 id="patient-panel-title">내 화면</h2>
          </div>
          <PatientPanel
            careDone={sync.careDone}
            checked={patientChecks[care]}
            onCareDoneToggle={() => {
              setSharedSync((current) => ({
                ...current,
                [care]: { ...current[care], careDone: !current[care].careDone },
              }));
              publishSync({
                source: '내 화면',
                target: '파트너 화면',
                label: sync.careDone ? '완료 상태를 다시 확인 중으로 되돌렸어요' : '오늘 항목 완료가 파트너 화면에 즉시 반영됐어요',
              });
            }}
            onToggle={(id) => {
              const label = scenario.patient.checklist.find((item) => item.id === id)?.label ?? '체크 항목';
              setPatientChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }));
              publishSync({
                source: '내 화면',
                target: '파트너 화면',
                label: `${label} 변경이 공유 상태로 즉시 전송됐어요`,
              });
            }}
            partnerConfirmed={sync.partnerConfirmed}
            scenario={scenario}
            syncEvent={syncEvent}
          />
        </article>

        <div className={styles.syncBridge} aria-live="polite" data-testid="live-sync-bridge" key={syncEvent.id}>
          <span>Live Sync</span>
          <strong>{syncEvent.source} → {syncEvent.target}</strong>
          <p>{syncEvent.label}</p>
        </div>

        <article className={styles.panel} data-testid="demo-device-frame" aria-labelledby="partner-panel-title">
          <DeviceChrome />
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Partner</span>
            <h2 id="partner-panel-title">파트너 화면</h2>
          </div>
          <PartnerPanel
            careDone={sync.careDone}
            checked={partnerChecks[care]}
            onPartnerConfirmToggle={() => {
              setSharedSync((current) => ({
                ...current,
                [care]: { ...current[care], partnerConfirmed: !current[care].partnerConfirmed },
              }));
              publishSync({
                source: '파트너 화면',
                target: '내 화면',
                label: sync.partnerConfirmed ? '파트너 확인을 다시 대기 상태로 바꿨어요' : '파트너 확인 완료가 내 화면에 바로 도착했어요',
              });
            }}
            onToggle={(id) => {
              const label = scenario.partner.actions.find((item) => item.id === id)?.label ?? '도움 행동';
              setPartnerChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }));
              publishSync({
                source: '파트너 화면',
                target: '내 화면',
                label: `${label} 체크가 내 화면의 공유 로그에 반영됐어요`,
              });
            }}
            partnerConfirmed={sync.partnerConfirmed}
            scenario={scenario}
            syncEvent={syncEvent}
          />
        </article>
      </section>
    </div>
  );
}

function DeviceChrome() {
  return (
    <>
      <span className={styles.dynamicIsland} data-testid="demo-dynamic-island" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonLeftTop}`} data-testid="demo-device-button" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonLeftBottom}`} data-testid="demo-device-button" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonRightTop}`} data-testid="demo-device-button" aria-hidden="true" />
      <span className={`${styles.deviceButton} ${styles.deviceButtonRightBottom}`} data-testid="demo-device-button" aria-hidden="true" />
    </>
  );
}
