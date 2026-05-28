import { IVF_STAGES } from './demo-scenarios';
import styles from './dual-panel-demo.module.css';

export function getOrbitPosition({ index, total, radius, center, startAngle = -90 }: { index: number; total: number; radius: number; center: number; startAngle?: number }): { left: number; top: number } {
  const angle = (startAngle + ((index - 1) * 360) / total) * (Math.PI / 180);
  return { left: center + radius * Math.cos(angle), top: center + radius * Math.sin(angle) };
}

export function IntroLanding({ onStartDemo }: { onStartDemo: () => void }) {
  return (
    <main className={`${styles.demoShell} ${styles.introShell}`} data-testid="demo-intro-landing">
      <header className={styles.introHeader}>
        <p className="eyebrow">Fevio Demo</p>
        <h1>병원 안내가 두 개의 케어 화면으로 바뀝니다</h1>
        <p>내 화면에는 실행 카드로, 파트너 화면에는 역할 카드로 나뉩니다.</p>
      </header>

      <section className={styles.orbitContainer} aria-label="IVF 7단계 orbit">
        <div className={styles.orbitRing} aria-hidden="true" />
        {IVF_STAGES.map((stage) => {
          const position = getOrbitPosition({ index: stage.index, total: IVF_STAGES.length, radius: 225, center: 280 });
          return (
            <div
              key={stage.id}
              className={styles.orbitNode}
              style={{ left: position.left, top: position.top }}
            >
              <span className={styles.orbitNodePill}>{stage.index}</span>
              <strong>{stage.label}</strong>
              <small>{stage.dominantMode}</small>
            </div>
          );
        })}
        <div className={styles.centerCard}>
          <span>Fevio</span>
          <strong>병원 안내 입력</strong>
          <p>한 문장에서 내 화면과 파트너 역할을 만듭니다.</p>
          <button type="button" onClick={onStartDemo}>병원 안내 넣어보기</button>
        </div>
      </section>

      <section className={styles.mobileStageList} aria-label="IVF 7단계 목록">
        {IVF_STAGES.map((stage) => (
          <div key={stage.id}>
            <span>{stage.index}</span>
            <strong>{stage.label}</strong>
            <small>{stage.description}</small>
          </div>
        ))}
      </section>

      <footer className={styles.introFooter}>One memo. <strong>Two care roles.</strong></footer>
    </main>
  );
}
