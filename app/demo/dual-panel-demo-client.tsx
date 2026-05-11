'use client';

import { useMemo, useState } from 'react';
import type { PresentationCareParam } from '../../src/features/adaptive-home/presentation-scenarios';
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

  const scenario = DEMO_SCENARIOS[care];
  const activeIndex = useMemo(() => DEMO_ORDER.indexOf(care) + 1, [care]);

  return (
    <div className={styles.demoShell}>
      <header className={styles.compactHeader}>
        <div>
          <p className="eyebrow">Dual-view demo</p>
          <h1>환자와 파트너가 같은 상황을 봅니다</h1>
        </div>
        <div className={styles.compactController} role="group" aria-label="치료 상황 선택">
          {DEMO_ORDER.map((value) => (
            <button
              aria-pressed={care === value}
              className={care === value ? styles.activeStateButton : ''}
              key={value}
              onClick={() => setCare(value)}
              type="button"
            >
              {DEMO_SCENARIOS[value].shortLabel}
            </button>
          ))}
        </div>
        <span className={styles.stepBadge}>{activeIndex}/3</span>
      </header>

      <section className={styles.dualPanel} aria-label="환자와 파트너 동시 화면" key={care}>
        <article className={styles.panel} aria-labelledby="patient-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Patient</span>
            <h2 id="patient-panel-title">환자 화면</h2>
          </div>
          <PatientPanel
            checked={patientChecks[care]}
            onToggle={(id) => setPatientChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }))}
            scenario={scenario}
          />
        </article>

        <article className={styles.panel} aria-labelledby="partner-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Partner</span>
            <h2 id="partner-panel-title">파트너 화면</h2>
          </div>
          <PartnerPanel
            checked={partnerChecks[care]}
            onToggle={(id) => setPartnerChecks((current) => ({ ...current, [care]: toggleSet(current[care], id) }))}
            scenario={scenario}
          />
        </article>
      </section>
    </div>
  );
}
