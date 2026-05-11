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

  const scenario = DEMO_SCENARIOS[care];
  const activeIndex = useMemo(() => DEMO_ORDER.indexOf(care) + 1, [care]);
  const sync = sharedSync[care];
  const careInputLabels: Record<PresentationCareParam, string> = {
    injection: '주사 준비',
    clinic: '병원 다녀오기',
    waiting: '기다리는 중',
  };

  return (
    <div className={styles.demoShell}>
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
        <article className={styles.panel} aria-labelledby="patient-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>My care</span>
            <h2 id="patient-panel-title">내 화면</h2>
          </div>
          <PatientPanel
            careDone={sync.careDone}
            checked={patientChecks[care]}
            onCareDoneToggle={() =>
              setSharedSync((current) => ({
                ...current,
                [care]: { ...current[care], careDone: !current[care].careDone },
              }))
            }
            onToggle={(id) => setPatientChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }))}
            partnerConfirmed={sync.partnerConfirmed}
            scenario={scenario}
          />
        </article>

        <article className={styles.panel} aria-labelledby="partner-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Partner</span>
            <h2 id="partner-panel-title">파트너 화면</h2>
          </div>
          <PartnerPanel
            careDone={sync.careDone}
            checked={partnerChecks[care]}
            onPartnerConfirmToggle={() =>
              setSharedSync((current) => ({
                ...current,
                [care]: { ...current[care], partnerConfirmed: !current[care].partnerConfirmed },
              }))
            }
            onToggle={(id) => setPartnerChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }))}
            partnerConfirmed={sync.partnerConfirmed}
            scenario={scenario}
          />
        </article>
      </section>
    </div>
  );
}
