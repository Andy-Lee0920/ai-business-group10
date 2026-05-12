import { IVF_STAGES, type IvfStage } from './demo-scenarios';
import styles from './dual-panel-demo.module.css';

export function getOrbitPosition({ index, total, radius, center, startAngle = -90 }: { index: number; total: number; radius: number; center: number; startAngle?: number }): { left: number; top: number } {
  const angle = (startAngle + ((index - 1) * 360) / total) * (Math.PI / 180);
  return { left: center + radius * Math.cos(angle), top: center + radius * Math.sin(angle) };
}

export function IntroLanding({ onStartDemo, onSelectStage }: { onStartDemo: () => void; onSelectStage: (stage: IvfStage) => void }) {
  return (
    <main className={`${styles.demoShell} ${styles.introShell}`} data-testid="demo-intro-landing">
      <header className={styles.introHeader}>
        <p className="eyebrow">Fevio Technology Demo</p>
        <h1>Fevio의 핵심 아키텍처는 Generative UI다</h1>
        <p>하나의 앱이 IVF 사이클 내내 환자와 파트너에게 다른 care experience를 생성합니다.</p>
      </header>

      <section className={styles.orbitContainer} aria-label="IVF 7단계 orbit">
        <div className={styles.orbitRing} aria-hidden="true" />
        {IVF_STAGES.map((stage) => {
          const position = getOrbitPosition({ index: stage.index, total: IVF_STAGES.length, radius: 225, center: 280 });
          return (
            <button
              key={stage.id}
              type="button"
              className={styles.orbitNode}
              style={{ left: position.left, top: position.top }}
              onClick={() => onSelectStage(stage.id)}
            >
              <span className={styles.orbitNodePill}>{stage.index}</span>
              <strong>{stage.label}</strong>
              <small>{stage.dominantMode}</small>
            </button>
          );
        })}
        <div className={styles.centerCard}>
          <span>Fevio</span>
          <strong>Care State Engine</strong>
          <p>Shared state → role-specific utility UI</p>
          <button type="button" onClick={onStartDemo}>7단계 데모 시작하기</button>
        </div>
      </section>

      <section className={styles.mobileStageList} aria-label="IVF 7단계 목록">
        {IVF_STAGES.map((stage) => (
          <button key={stage.id} type="button" onClick={() => onSelectStage(stage.id)}>
            <span>{stage.index}</span>
            <strong>{stage.label}</strong>
            <small>{stage.description}</small>
          </button>
        ))}
      </section>

      <footer className={styles.introFooter}>Same app. <strong>Shared state.</strong> Different experience.</footer>
    </main>
  );
}
