import Link from "next/link";
import styles from "./interview.module.css";

export default function SurveyPage() {
  return (
    <main className={`app-shell ${styles.page}`}>
      <header className={styles.header}>
        <h1>설문 참여</h1>
        <p>
          현재 리서치 응답 수집은 제품 데이터와 분리된 비공개 운영 화면에서
          관리합니다.
        </p>
      </header>

      <section className={styles.card} aria-labelledby="survey-status-title">
        <h2 id="survey-status-title">Fevio 제품 화면에서는 수집하지 않아요</h2>
        <p className={styles.emptyText}>
          Fevio 앱은 Supabase 기반 치료 운영 데이터만 다룹니다. 병원 안내,
          오늘 실행, 기록, 파트너 공유 흐름은 홈 데모에서 확인해 주세요.
        </p>
        <Link className={styles.primaryButton} href="/demo">
          듀얼뷰 데모 보기
        </Link>
      </section>
    </main>
  );
}
