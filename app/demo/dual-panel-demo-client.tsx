'use client';

import { useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { CoupleAvatarPair } from '../../src/design/couple-avatars';
import { DEMO_SCENARIOS, IVF_STAGES, STAGE_INDEX_TO_ID, stageIndexFor, type IvfStage, type IvfStageIndex } from './demo-scenarios';
import { createInitialDemoState, demoReducer, summarizeSharedCareState } from './demo-state';
import { IntroLanding } from './intro-landing';
import { PartnerPanel } from './partner-panel';
import { PatientPanel } from './patient-panel';
import styles from './dual-panel-demo.module.css';

export function DualPanelDemoClient({ initialMode, initialStageIndex }: { initialMode: 'intro' | 'stage'; initialStageIndex: IvfStageIndex }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(demoReducer, undefined, () => createInitialDemoState(initialStageIndex, initialMode));
  const scenario = DEMO_SCENARIOS[state.selectedStage];
  const summary = summarizeSharedCareState(state);

  function selectStage(stage: IvfStage, navigation: 'push' | 'replace' = 'replace') {
    dispatch({ type: 'SELECT_STAGE', stage });
    const href = `/demo?mode=stage&stage=${stageIndexFor(stage)}`;
    if (navigation === 'push') router.push(href);
    else router.replace(href, { scroll: false });
  }

  if (state.mode === 'intro' && initialMode === 'intro') {
    return <IntroLanding onStartDemo={() => selectStage(STAGE_INDEX_TO_ID['2'], 'push')} onSelectStage={(stage) => selectStage(stage, 'push')} />;
  }

  return (
    <div className={styles.demoShell} data-testid="demo-preview-stage">
      <header className={styles.compactHeader}>
        <div>
          <p className="eyebrow">Fevio Gen UI Demo</p>
          <h1>하나의 IVF 사이클, 두 개의 역할 기반 화면</h1>
          <p className={styles.stageContextLine}>{summary.stageLabel} · {scenario.description}</p>
        </div>
        <div className={styles.careInput}>
          <p id="care-input-label">Care state</p>
          <div className={styles.compactController} role="group" aria-labelledby="care-input-label">
            {IVF_STAGES.map((stage) => {
              const selected = state.selectedStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  data-testid={`stage-pill-${stage.index}`}
                  className={`${styles.stagePill} ${selected ? styles.stagePillActive : ''}`}
                  aria-pressed={selected}
                  onClick={() => selectStage(stage.id)}
                >
                  <span>{stage.index}</span>
                  <strong>{stage.shortLabel}</strong>
                </button>
              );
            })}
          </div>
          <small>{scenario.dominantMode}</small>
        </div>
        <span className={styles.stepBadge}>{scenario.index}/7</span>
      </header>

      <nav className={styles.homeSurfaceLinks} aria-label="home surface demo links">
        <a href="/home?care=two_week_wait_day">2주 대기</a>
        <a href="/home?care=result_protection_day">결과 확인</a>
        <a href="/onboard/quick-capture">Quick Capture</a>
        <a href="/onboard/prescription-capture">Prescription Capture</a>
      </nav>

      <section className={styles.dualPanel} aria-label="내 화면과 파트너 동시 화면" key={state.selectedStage}>
        <article className={styles.panel} data-testid="demo-device-frame" aria-labelledby="patient-panel-title">
          <DeviceChrome />
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Patient</span>
            <h2 id="patient-panel-title">내 화면</h2>
          </div>
          <PatientPanel scenario={scenario} state={state} dispatch={dispatch} />
        </article>

        <SharedCareStatePanel summary={summary} />

        <article className={styles.panel} data-testid="demo-device-frame" aria-labelledby="partner-panel-title">
          <DeviceChrome />
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Partner</span>
            <h2 id="partner-panel-title">파트너 화면</h2>
          </div>
          <PartnerPanel scenario={scenario} state={state} dispatch={dispatch} />
        </article>
      </section>
    </div>
  );
}

function SharedCareStatePanel({ summary }: { summary: ReturnType<typeof summarizeSharedCareState> }) {
  return (
    <div className={styles.sharedStatePanel} aria-live="polite" data-testid="shared-care-state-panel">
      <CoupleAvatarPair className={styles.syncCoupleAvatar} />
      <span>Shared Care State</span>
      <strong>{summary.stageLabel}</strong>
      <p>{summary.sharingLabel}</p>
      <small>완료된 행동 {summary.completedCount}건</small>
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
