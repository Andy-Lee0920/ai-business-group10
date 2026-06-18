'use client';

import { useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import type { ParsedClinicMemo } from '../../src/domain/clinic-memo-parser';
import { DEMO_SCENARIOS, IVF_STAGES, stageIndexFor, type IvfStage, type IvfStageIndex } from './demo-scenarios';
import { createInitialDemoState, demoReducer, summarizeSharedCareState, type ActionLogEntry, type DemoState } from './demo-state';
import { DemoDeviceFrame } from './demo-device-frame';
import { DemoInputScreen } from './demo-input-screen';
import { DemoParsingScreen } from './demo-parsing-screen';
import { IntroLanding } from './intro-landing';
import { PartnerPanel } from './partner-panel';
import { PatientPanel } from './patient-panel';
import { buildDemoExperienceGuide } from './stage-experience';
import styles from './dual-panel-demo.module.css';

export function DualPanelDemoClient({ initialMode, initialStageIndex }: { initialMode: Exclude<DemoState['mode'], 'parsing'>; initialStageIndex: IvfStageIndex }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(demoReducer, undefined, () => createInitialDemoState(initialStageIndex, initialMode));
  const scenario = DEMO_SCENARIOS[state.selectedStage];
  const guide = buildDemoExperienceGuide(scenario);
  const summary = summarizeSharedCareState(state);
  const generatedFromMemo = Boolean(state.parsedResult);

  const startInput = useCallback(() => {
    dispatch({ type: 'START_INPUT' });
    router.push('/demo?mode=input');
  }, [router]);

  const submitMemo = useCallback((input: string) => {
    dispatch({ type: 'SUBMIT_MEMO', input });
    router.replace('/demo?mode=parsing', { scroll: false });
  }, [router]);

  const completeParsing = useCallback(() => {
    dispatch({ type: 'PARSING_COMPLETE' });
    router.replace('/demo?mode=generated', { scroll: false });
  }, [router]);

  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' });
    router.push('/demo');
  }, [router]);

  function selectStage(stage: IvfStage) {
    dispatch({ type: 'SELECT_STAGE', stage });
    router.replace(`/demo?mode=stage&stage=${stageIndexFor(stage)}`, { scroll: false });
  }

  if (state.mode === 'intro') {
    return <IntroLanding onStartDemo={startInput} />;
  }

  if (state.mode === 'input') {
    return <DemoInputScreen onSubmit={submitMemo} />;
  }

  if (state.mode === 'parsing') {
    if (!state.parsedResult) return <DemoInputScreen onSubmit={submitMemo} />;
    return <DemoParsingScreen parsedResult={state.parsedResult} onComplete={completeParsing} />;
  }

  return (
    <div className={`${styles.demoShell} ${styles[`demoShell_${scenario.accent}`] ?? ''}`} data-testid="demo-preview-stage">
      <header className={styles.generatedHeader}>
        <div>
          <p className="eyebrow">Memo to Care</p>
          <h1>병원 안내가 두 역할 화면으로 갈라졌습니다</h1>
          <p className={styles.stageContextLine}>{summary.stageLabel} · {scenario.description}</p>
        </div>
        <div className={styles.generatedHeaderMeta}>
          <span>{summary.sharingLabel}</span>
          <button type="button" className={styles.resetDemoLink} onClick={resetDemo}>다른 안내로 다시 보기</button>
        </div>
        <details className={styles.debugStageControl} open>
          <summary>발표자용 단계 전환</summary>
          <div className={styles.compactController} role="group" aria-label="발표자용 단계 전환">
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
        </details>
      </header>

      <section className={styles.experienceGuide} aria-label="상황별 화면 변화 가이드" data-testid="demo-experience-guide">
        <div>
          <span className={styles.guideKicker}>What changes now</span>
          <strong>{guide.surfaceShift}</strong>
        </div>
        <div className={styles.guideDeltaGrid}>
          <p><span>내 화면</span>{guide.patientDelta}</p>
          <p><span>파트너 화면</span>{guide.partnerDelta}</p>
        </div>
        <ul className={styles.guideProofList} aria-label="화면 변화 확인 포인트">
          {guide.proofPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </section>

      <section className={`${styles.dualPanel} ${generatedFromMemo ? styles.dualPanelFromMemo : ''}`} aria-label="내 화면과 파트너 동시 화면" key={`${state.selectedStage}-${state.mode}`}>
        <DemoDeviceFrame className={`${styles.revealPatient} ${generatedFromMemo ? styles.splitPatientFromMemo : ''}`} labelledBy="patient-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Patient</span>
            <h2 id="patient-panel-title">내 화면</h2>
          </div>
          <PatientPanel scenario={scenario} state={state} dispatch={dispatch} />
        </DemoDeviceFrame>

        <SourceToCareBridge summary={summary} parsedResult={state.parsedResult} actionLog={state.actionLog} generatedFromMemo={generatedFromMemo} />

        <DemoDeviceFrame className={`${styles.revealPartner} ${generatedFromMemo ? styles.splitPartnerFromMemo : ''}`} labelledBy="partner-panel-title">
          <div className={styles.panelHeader}>
            <span className={styles.panelKicker}>Partner</span>
            <h2 id="partner-panel-title">파트너 화면</h2>
          </div>
          <PartnerPanel scenario={scenario} state={state} dispatch={dispatch} />
        </DemoDeviceFrame>
      </section>
    </div>
  );
}

function SourceToCareBridge({ summary, parsedResult, actionLog, generatedFromMemo }: { summary: ReturnType<typeof summarizeSharedCareState>; parsedResult: ParsedClinicMemo | null; actionLog: ActionLogEntry[]; generatedFromMemo: boolean }) {
  const latest = actionLog.at(-1);
  return (
    <aside className={`${styles.sourceBridge} ${styles.revealBridge} ${generatedFromMemo ? styles.splitBridgeFromMemo : ''}`} aria-live="polite" data-testid="shared-care-state-panel">
      <section>
        <span>현재 단계</span>
        <strong>{summary.stageLabel}</strong>
        <p>{summary.sharingLabel}</p>
      </section>

      <section data-testid="source-to-care-bridge">
        <span>Fevio가 읽은 병원 안내</span>
        <strong>{parsedResult ? '입력 메모에서 실행·공유 신호를 추출' : summary.stageLabel}</strong>
        <small>{summary.stageLabel}</small>
      </section>

      <div className={styles.sourceTokenList} aria-label="읽어낸 안내">
        {(parsedResult?.extractedTokens ?? []).slice(0, 4).map((token) => (
          <p key={`${token.label}-${token.value}`}>
            <span>{token.label}</span>
            <strong>{token.value}</strong>
          </p>
        ))}
      </div>

      <div className={styles.sourceProofGrid}>
        <div>
          <span>내 화면</span>
          <strong>실행 카드</strong>
        </div>
        <div>
          <span>파트너 화면</span>
          <strong>준비 역할</strong>
        </div>
      </div>

      <small className={styles.sourceCompletedCount}>완료된 행동 {summary.completedCount}건</small>
      <p className={styles.sourceLivePulse}>{latest ? summary.lastEventLabel : '방금 케어 화면으로 옮겼어요'}</p>
    </aside>
  );
}
