"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./interview.module.css";

type FeedbackFocus = "execution" | "partner" | "input" | "trust" | "";

export default function SurveyPage() {
  const [focus, setFocus] = useState<FeedbackFocus>("");
  const [dailyReason, setDailyReason] = useState("");
  const [concern, setConcern] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!focus || !dailyReason.trim()) return;
    setSubmitted(true);
  }

  return (
    <main className={`app-shell ${styles.page}`}>
      <header className={styles.header}>
        <h1>Fevio 피드백 남기기</h1>
        <p>IVF 치료 중 매일 열 이유가 있는지, 실행 관리 관점에서만 짧게 확인합니다.</p>
      </header>

      <section className={styles.card} aria-labelledby="survey-focus-title">
        <h2 id="survey-focus-title">가장 필요해 보이는 도움</h2>
        <div className={styles.formGrid}>
          <select value={focus} onChange={(event) => setFocus(event.target.value as FeedbackFocus)} aria-label="가장 필요한 도움">
            <option value="">선택해 주세요</option>
            <option value="execution">투약·주사 시간 누락 방지</option>
            <option value="partner">파트너와 확인 분담</option>
            <option value="input">병원 안내문 사진 정리</option>
            <option value="trust">AI/OCR 결과 확인 절차</option>
          </select>
        </div>
        <textarea
          className={styles.textarea}
          value={dailyReason}
          onChange={(event) => setDailyReason(event.target.value)}
          placeholder="이 앱을 매일 열게 된다면 어떤 순간 때문일까요?"
          aria-label="매일 열 이유"
        />
        <textarea
          className={styles.textarea}
          value={concern}
          onChange={(event) => setConcern(event.target.value)}
          placeholder="불안하거나 신뢰가 떨어질 것 같은 지점이 있다면 적어주세요."
          aria-label="우려 지점"
        />
        <button type="button" className={styles.primaryButton} onClick={submit}>피드백 확인</button>
        {submitted ? <p className={styles.emptyText}>확인했습니다. 실제 저장 없이 현재 세션에서만 표시됩니다.</p> : null}
      </section>

      <section className={styles.card} aria-label="피드백 기준">
        <h2>확인 기준</h2>
        <p className={styles.emptyText}>Fevio는 감정 기록 앱이 아니라 병원 안내, 투약 시간, 주사 기록, 파트너 공유를 함께 관리하는 치료 운영 앱으로 검증합니다.</p>
        <Link href="/home" className={styles.primaryButton} style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          오늘 실행 화면 보기
        </Link>
      </section>
    </main>
  );
}
