import Link from 'next/link';
import styles from './home-utility-launcher.module.css';

export function HomeUtilityLauncher() {
  return (
    <section className={styles.utilityLauncher} aria-labelledby="adaptive-utility-launcher-title">
      <div className={styles.utilityHeader}>
        <p>Low-energy input</p>
        <h2 id="adaptive-utility-launcher-title">바로 정리하기</h2>
        <span>지금 필요한 하나만 넣어도 오늘 화면과 공유 상태가 같이 정리됩니다.</span>
      </div>
      <div className={styles.utilityGrid}>
        <Link className={styles.utilityLink} href="/schedule">
          <span>01</span>
          <strong>일정 등록·변경</strong>
          <small>방문·검사·취소를 오늘 실행 카드로 연결</small>
        </Link>
        <Link className={styles.utilityLink} href="/medication">
          <span>02</span>
          <strong>약·주사 추가</strong>
          <small>이름·용량·시간을 직접 확인하고 완료 체크</small>
        </Link>
        <Link className={styles.utilityLink} href="/emotion">
          <span>03</span>
          <strong>감정 부담 기록</strong>
          <small>공유 기본 OFF, 원문 없이 도움 신호만 선택 공유</small>
        </Link>
        <Link className={styles.utilityLink} href="/capture">
          <span>04</span>
          <strong>병원 메모 정리</strong>
          <small>들은 내용을 확정 전 카드로 나누기</small>
        </Link>
      </div>
      <SharedCareProjectionCard />
    </section>
  );
}

export function SharedCareProjectionCard() {
  return (
    <div className={styles.sharedProjection} aria-label="파트너 공유 상태">
      <span>Shared care projection</span>
      <strong>내가 확정한 카드만 파트너 화면에 안전하게 보입니다.</strong>
      <p>원문 메모와 비공개 필드는 보내지 않고, 현재·완료 상태만 읽기 전용으로 이어집니다.</p>
    </div>
  );
}
