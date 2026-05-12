'use client';

import { useMemo, useState } from 'react';
import type { PresentationCareParam } from '../../src/features/adaptive-home/presentation-scenarios';
import { SelectionChip } from '../../src/components/ui';
import { CoupleAvatarPair } from '../../src/design/couple-avatars';
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
    label: '확인할 항목이 파트너 역할에 반영됐습니다',
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
          <p className="eyebrow">함께 보는 케어 데모</p>
          <h1>오늘 상황에 맞춰 두 화면이 바뀝니다</h1>
        </div>
        <div className={styles.careInput}>
          <p id="care-input-label">오늘 어떤 케어 장면을 볼까요?</p>
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
          <small>내 화면은 케어 흐름, 파트너 화면은 역할만 보여줍니다.</small>
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
                label: sync.careDone ? '완료 표시가 해제됐습니다' : '완료 상태가 파트너 화면에 반영됐습니다',
              });
            }}
            onToggle={(id) => {
              const label = scenario.patient.checklist.find((item) => item.id === id)?.label ?? '체크 항목';
              setPatientChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }));
              publishSync({
                source: '내 화면',
                target: '파트너 화면',
                label: `${label} 확인 상태가 공유됐습니다`,
              });
            }}
            partnerConfirmed={sync.partnerConfirmed}
            scenario={scenario}
            syncEvent={syncEvent}
          />
        </article>

        <div className={styles.syncBridge} aria-live="polite" data-testid="live-sync-bridge" key={syncEvent.id}>
          <CoupleAvatarPair className={styles.syncCoupleAvatar} />
          <span>함께 이어짐</span>
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
                label: sync.partnerConfirmed ? '파트너 확인이 대기 상태로 돌아갔습니다' : '파트너 확인이 내 화면에 반영됐습니다',
              });
            }}
            onToggle={(id) => {
              const label = scenario.partner.actions.find((item) => item.id === id)?.label ?? '도움 행동';
              setPartnerChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }));
              publishSync({
                source: '파트너 화면',
                target: '내 화면',
                label: `${label} 확인이 내 화면에 반영됐습니다`,
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
