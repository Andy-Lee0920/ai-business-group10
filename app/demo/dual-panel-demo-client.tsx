'use client';

import { useMemo, useState } from 'react';
import { SegmentedButton } from '../../src/components/ui';
import { computeHomeContext } from '../../src/domain/home-composition';
import { AdaptiveHomeRuntime } from '../../src/features/adaptive-home/adaptive-home-runtime';
import { getPresentationScenarioCards, type PresentationCareParam } from '../../src/features/adaptive-home/presentation-scenarios';
import { PartnerPanel } from './partner-panel';
import styles from './dual-panel-demo.module.css';

const OPTIONS: Array<{ value: PresentationCareParam; label: string }> = [
  { value: 'injection', label: '주사 맞는 날' },
  { value: 'clinic', label: '병원 가는 날' },
  { value: 'waiting', label: '기다리는 날' },
];

const SITUATION_COPY: Record<PresentationCareParam, string> = {
  injection: '정확한 시간과 준비물이 중요한 날입니다. 환자 화면은 주사 준비를 앞으로 당기고, 파트너 화면은 확인 행동을 알려줍니다.',
  clinic: '이동, 검사, 결과 확인이 이어지는 날입니다. 환자 화면은 방문 준비를 정리하고, 파트너 화면은 동행 행동을 알려줍니다.',
  waiting: '할 수 있는 일이 적고 불안이 커지는 날입니다. 환자 화면은 조용해지고, 파트너 화면은 재촉하지 않는 행동을 알려줍니다.',
};

export function DualPanelDemoClient() {
  const [care, setCare] = useState<PresentationCareParam>('injection');

  const context = useMemo(() => {
    const now = new Date('2026-05-13T09:00:00+09:00');
    return computeHomeContext(getPresentationScenarioCards(care, now), now);
  }, [care]);

  return (
    <div className={styles.demoShell}>
      <header className={styles.hero}>
        <p className="eyebrow">Dual-view presentation demo</p>
        <h1>치료 상황이 바뀌면, 두 사람의 화면이 함께 바뀝니다.</h1>
        <p>
          발표용 화면입니다. 로그인 없이 한 URL에서 환자 화면과 파트너 화면을 동시에 보여주며, 파트너가 지금 어떤 행동을 해야 하는지까지
          함께 바뀌는 것을 보여줍니다.
        </p>
        <SegmentedButton
          label="치료 상황 선택"
          onSelect={(value) => setCare(value as PresentationCareParam)}
          options={OPTIONS}
          value={care}
        />
        <p className={styles.situationCopy}>{SITUATION_COPY[care]}</p>
      </header>

      <section className={styles.dualPanel} aria-label="환자와 파트너 동시 화면">
        <article className={styles.panel} aria-labelledby="patient-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Patient view</span>
            <h2 id="patient-panel-title">환자 화면</h2>
          </div>
          <div className={styles.phoneFrame} data-testid="demo-patient-panel">
            <AdaptiveHomeRuntime context={context} demoMode />
          </div>
        </article>

        <article className={styles.panel} aria-labelledby="partner-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Partner view</span>
            <h2 id="partner-panel-title">파트너 화면</h2>
          </div>
          <PartnerPanel care={care} />
        </article>
      </section>
    </div>
  );
}
