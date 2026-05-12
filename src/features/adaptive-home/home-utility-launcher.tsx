import Link from 'next/link';
import styles from './home-utility-launcher.module.css';

export function HomeUtilityLauncher({ fullSetupPending = false }: { fullSetupPending?: boolean } = {}) {
  return (
    <section className={styles.utilityLauncher} aria-labelledby="adaptive-utility-launcher-title">
      <div className={styles.utilityHeader}>
        <p>케어 정리</p>
        <h2 id="adaptive-utility-launcher-title">필요한 기록만 빠르게 남기기</h2>
        <span>일정, 약, 주사, 진료 메모를 확정된 내용 중심으로 정리합니다.</span>
      </div>
      {fullSetupPending ? (
        <Link className={styles.quickSetupLink} href="/onboard/full-setup" data-testid="full-setup-entrypoint">
          <span>나머지는 오늘 저녁에</span>
          <strong>Full Setup 이어서 하기</strong>
          <small>처방 사진, 약 이름, 용량은 준비됐을 때 직접 확인해요.</small>
        </Link>
      ) : null}
      <div className={styles.utilityGrid}>
        <Link className={styles.utilityLink} href="/schedule">
          <span>01</span>
          <strong>일정 변경</strong>
          <small>방문·검사 시간을 다시 확인</small>
        </Link>
        <Link className={styles.utilityLink} href="/medication">
          <span>02</span>
          <strong>약·주사 확인</strong>
          <small>약 이름, 용량, 시간만 저장</small>
        </Link>
        <Link className={styles.utilityLink} href="/emotion">
          <span>03</span>
          <strong>컨디션 메모</strong>
          <small>공유 여부를 선택해 기록</small>
        </Link>
        <Link className={styles.utilityLink} href="/ivf-record">
          <span>04</span>
          <strong>시술 기록</strong>
          <small>단계와 날짜를 보존</small>
        </Link>
        <Link className={styles.utilityLink} href="/capture">
          <span>05</span>
          <strong>병원 메모</strong>
          <small>들은 지시를 일정·할 일로 정리</small>
        </Link>
      </div>
      <SharedCareProjectionCard />
    </section>
  );
}

export function SharedCareProjectionCard() {
  return (
    <div className={styles.sharedProjection} aria-label="파트너 공유 상태">
      <span>파트너 역할 번역</span>
      <strong>도움 역할만 보입니다.</strong>
      <p>감정이나 원문 대신, 지금 함께 확인할 행동만 전달합니다.</p>
    </div>
  );
}
