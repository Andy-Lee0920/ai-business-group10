import React, { useState, useEffect } from "react";
import "./index.css";

function App() {
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 애니메이션 관리를 위한 Intersection Observer 세팅
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = "1";
            e.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.12 },
    );

    const elements = document.querySelectorAll(
      ".mission-card, .step, .impact-card, .target-card, .flow-node",
    );

    elements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity .5s ease, transform .5s ease";
      observer.observe(el);
    });

    return () => observer.disconnect(); // 컴포넌트 언마운트 시 정리
  }, []);

  const handleSuccessAlert = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      alert(
        "🎉 미션 참여 완료!\n결제가 확인되면 미션 인증 방법을 안내해드립니다.\n\n현재는 베타 준비 중입니다. 출시 알림을 신청해 주세요!",
      );
    }, 300);
  };

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="logo">
          미션<span>팟</span>
        </div>
        <ul className="nav-links">
          <li>
            <a href="#how">이용방법</a>
          </li>
          <li>
            <a href="#missions">오늘의 미션</a>
          </li>
          <li>
            <a href="#model">비즈니스</a>
          </li>
          <li>
            <a href="#impact">임팩트</a>
          </li>
        </ul>
        <button className="nav-cta" onClick={() => setIsModalOpen(true)}>
          앱 출시 알림 받기
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-glow2"></div>

        <div className="hero-badge">
          <span className="dot"></span>
          지금 213명이 미션 중
        </div>

        <h1>
          오늘의 미션,
          <br />
          <span className="line2">1,000원으로 시작</span>
        </h1>

        <p className="hero-sub">
          플랫폼이 던져주는 게릴라 미션에 참여하세요.
          <br />
          성공하면 환급, 실패하면 기부 — 어떻게 해도 의미 있는 하루.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            🚀 지금 미션 참여하기
          </button>
          <button
            className="btn-ghost"
            onClick={() =>
              document
                .getElementById("how")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            어떻게 되나요?
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">
              4,782<span>명</span>
            </div>
            <div className="stat-label">누적 참여자</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">
              68<span>%</span>
            </div>
            <div className="stat-label">평균 성공률</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">
              312<span>만원</span>
            </div>
            <div className="stat-label">누적 기부액</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker" id="ticker">
          <div className="ticker-item">
            <span className="tag green">완료</span> 점심시간 15분 산책하기 —
            34명 성공
          </div>
          <div className="ticker-item">
            <span className="tag red">진행중</span> 오늘 물 2L 마시기 — 마감
            3시간 전
          </div>
          <div className="ticker-item">
            <span className="tag">새 미션</span> 퇴근 후 스쿼트 30개 — 오후 7시
            오픈
          </div>
          {/* 공간상 생략되었으나 원래 HTML의 나머지 ticker 항목들을 여기에 동일하게 넣으시면 됩니다. */}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="container">
          <div className="section-label">HOW IT WORKS</div>
          <h2 className="section-title">4단계면 끝</h2>
          <p className="section-desc">
            복잡한 목표 설정 없이, 플랫폼이 던져주는 미션에 올라타기만 하세요.
          </p>

          <div className="steps">
            <div className="step" style={{ position: "relative" }}>
              <div className="step-num">01</div>
              <span className="step-icon">🔔</span>
              <h3>미션 수신</h3>
              <p>
                시간대·날씨·요일에 맞춘 게릴라 미션 푸시 알림이 도착합니다.
                "오늘 점심 15분 걷기 참가비 1천원!"
              </p>
              <div className="step-arrow">→</div>
            </div>
            {/* 나머지 step 요소들도 동일하게 복사하되 style 속성만 객체 형태로 변경해주세요 */}
          </div>
        </div>
      </section>

      {/* (중간 섹션들: LIVE MISSIONS, BUSINESS MODEL, SOCIAL IMPACT, TARGET은 HTML 원본을 그대로 가져오되 class -> className 으로만 바꿔서 넣어주세요) */}

      {/* FOOTER */}
      <footer>
        <div className="logo">
          미션<span style={{ color: "var(--accent)" }}>팟</span>
        </div>
        <p>
          소셜 임팩트 챌린지 서비스 · 베타 서비스 준비 중<br />
          문의: hello@missionpot.kr · 서울특별시
        </p>
        <p
          style={{
            marginTop: "16px",
            fontSize: "0.75rem",
            color: "rgba(107,107,128,0.6)",
          }}
        >
          © 2025 미션팟. 본 서비스는 사행행위 규제 준수를 위해 법무 검토
          중입니다.
        </p>
      </footer>

      {/* MODAL */}
      <div
        className={`modal-overlay ${isModalOpen ? "active" : ""}`}
        id="modal"
        style={{ display: isModalOpen ? "flex" : "none" }}
        onClick={(e) => {
          if (e.target.id === "modal") setIsModalOpen(false);
        }}
      >
        <div className="modal">
          <div className="modal-top">
            <span className="live-pill">🔴 LIVE</span>
          </div>
          <h2>점심시간 15분 걷기 🚶</h2>
          <p className="modal-desc">
            오늘 점심시간 안에 밖으로 나가 15분 이상 걸어보세요. 어디든 OK —
            걷는 풍경 사진 한 장이 인증 방법입니다.
          </p>

          <div className="modal-amount">
            <span>참가비</span>
            <strong>1,000원</strong>
          </div>

          <div className="modal-verify">
            <div className="verify-item">
              <span className="verify-icon">📍</span> GPS 위치 자동 기록
            </div>
            <div className="verify-item">
              <span className="verify-icon">⏱</span> 타임스탬프 자동 기록
            </div>
            <div className="verify-item">
              <span className="verify-icon">📸</span> 인증 사진 1장 업로드
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              취소
            </button>
            <button className="btn-primary" onClick={handleSuccessAlert}>
              1,000원 결제 & 참여
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
