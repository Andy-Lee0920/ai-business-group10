import Link from 'next/link';
import styles from './home-utility-launcher.module.css';

export function HomeUtilityLauncher({ fullSetupPending = false }: { fullSetupPending?: boolean } = {}) {
  return (
    <section className={styles.utilityLauncher} aria-labelledby="adaptive-utility-launcher-title">
      <div className={styles.utilityHeader}>
        <p>빠른 기록</p>
        <h2 id="adaptive-utility-launcher-title">필요한 것만 남기기</h2>
      </div>
      <Link className={styles.quickSetupLink} href="/onboard/quick-capture" data-testid="quick-capture-entrypoint">
        <span>병원 직후</span>
        <strong>빠른 기록 열기</strong>
      </Link>
      <Link className={styles.quickSetupLink} href="/onboard/prescription-capture" data-testid="prescription-capture-entrypoint">
        <span>처방 사진</span>
        <strong>사진으로 정리</strong>
      </Link>
      {fullSetupPending ? (
        <Link className={styles.quickSetupLink} href="/onboard/full-setup" data-testid="full-setup-entrypoint">
          <span>나중에</span>
          <strong>정리 이어서 하기</strong>
        </Link>
      ) : null}
      <div className={styles.utilityGrid}>
        <Link className={styles.utilityLink} href="/schedule">
          <span>01</span>
          <strong>일정 변경</strong>
        </Link>
        <Link className={styles.utilityLink} href="/medication">
          <span>02</span>
          <strong>약·주사 확인</strong>
        </Link>
        <Link className={styles.utilityLink} href="/ivf-record">
          <span>03</span>
          <strong>시술 기록</strong>
        </Link>
        <Link className={styles.utilityLink} href="/capture">
          <span>04</span>
          <strong>병원 메모</strong>
        </Link>
      </div>
      <SharedCareProjectionCard />
    </section>
  );
}

export function SharedCareProjectionCard() {
  return (
    <div className={styles.sharedProjection} aria-label="파트너 공유 상태">
      <span>파트너 공유</span>
      <strong>도움 역할만 보여요.</strong>
    </div>
  );
}
