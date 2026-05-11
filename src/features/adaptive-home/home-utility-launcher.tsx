import Link from 'next/link';
import styles from './home-utility-launcher.module.css';

export function HomeUtilityLauncher() {
  return (
    <section className={styles.utilityLauncher} aria-labelledby="adaptive-utility-launcher-title">
      <div className={styles.utilityHeader}>
        <p>작은 케어 정리</p>
        <h2 id="adaptive-utility-launcher-title">흩어진 케어를 한 장의 카드로</h2>
        <span>병원 안내, 약·주사, 감정 부담, 시술 기록을 각각 가장 짧은 확인 루프로 남깁니다.</span>
      </div>
      <div className={styles.utilityGrid}>
        <Link className={styles.utilityLink} href="/schedule">
          <span>01</span>
          <strong>일정 변경</strong>
          <small>방문·검사·취소를 오늘의 케어 흐름에 연결</small>
        </Link>
        <Link className={styles.utilityLink} href="/medication">
          <span>02</span>
          <strong>약·주사 확인</strong>
          <small>내가 확인한 용량과 시간만 실행 카드로 저장</small>
        </Link>
        <Link className={styles.utilityLink} href="/emotion">
          <span>03</span>
          <strong>감정 부담</strong>
          <small>기본 비공개, 공유 시 원문 없이 도움 신호만 전달</small>
        </Link>
        <Link className={styles.utilityLink} href="/ivf-record">
          <span>04</span>
          <strong>시술 기록</strong>
          <small>결과 해석 없이 단계·날짜를 안전하게 보존</small>
        </Link>
        <Link className={styles.utilityLink} href="/capture">
          <span>05</span>
          <strong>병원 메모</strong>
          <small>들은 내용을 확정 전 초안 카드로 나누기</small>
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
      <strong>역할로 번역돼요.</strong>
      <p>내 상태가 그대로 던져지는 것이 아니라, 파트너가 지금 할 수 있는 작은 도움으로 바뀌어 보입니다.</p>
    </div>
  );
}
