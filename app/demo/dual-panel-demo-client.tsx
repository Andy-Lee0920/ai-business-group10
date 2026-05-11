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

      <section className={styles.storyRail} aria-label="발표 내러티브">
        <article>
          <span>01 Problem</span>
          <strong>문제는 부주의가 아니라 전달 구조입니다</strong>
          <p>병원에서 들은 말이 집에서 다시 설명되는 동안 빠집니다.</p>
        </article>
        <article>
          <span>02 Input</span>
          <strong>지친 날엔 긴 입력 대신 한 번만 고릅니다</strong>
          <p>오늘에 가까운 상황을 고르면 필요한 도구가 먼저 올라옵니다.</p>
        </article>
        <article>
          <span>03 Shared care</span>
          <strong>선택 한 번으로 내 화면과 파트너 행동이 같이 바뀝니다.</strong>
          <p>파트너는 “뭘 해야 하지?”가 아니라 바로 행동을 봅니다.</p>
        </article>
      </section>

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
