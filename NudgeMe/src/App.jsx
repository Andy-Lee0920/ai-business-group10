import React, { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    return () => observer.disconnect();
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
          <li><a href="#how">이용방법</a></li>
          <li><a href="#missions">오늘의 미션</a></li>
          <li><a href="#model">비즈니스</a></li>
          <li><a href="#impact">임팩트</a></li>
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
              document.getElementById("how").scrollIntoView({ behavior: "smooth" })
            }
          >
            어떻게 되나요?
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">4,782<span>명</span></div>
            <div className="stat-label">누적 참여자</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">68<span>%</span></div>
            <div className="stat-label">평균 성공률</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">312<span>만원</span></div>
            <div className="stat-label">누적 기부액</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          <div className="ticker-item">
            <span className="tag green">완료</span> 점심시간 15분 산책하기 — 34명 성공
          </div>
          <div className="ticker-item">
            <span className="tag red">진행중</span> 오늘 물 2L 마시기 — 마감 3시간 전
          </div>
          <div className="ticker-item">
            <span className="tag">새 미션</span> 퇴근 후 스쿼트 30개 — 오후 7시 오픈
          </div>
          <div className="ticker-item">
            <span className="tag green">완료</span> 아침 공복 스트레칭 10분 — 89명 성공
          </div>
          <div className="ticker-item">
            <span className="tag red">진행중</span> 오늘 SNS 1시간 이하 사용 — 마감 자정
          </div>
          <div className="ticker-item">
            <span className="tag">새 미션</span> 점심 혼밥 없이 동료와 식사 — 내일 12시
          </div>
          <div className="ticker-item">
            <span className="tag green">완료</span> 점심시간 15분 산책하기 — 34명 성공
          </div>
          <div className="ticker-item">
            <span className="tag red">진행중</span> 오늘 물 2L 마시기 — 마감 3시간 전
          </div>
          <div className="ticker-item">
            <span className="tag">새 미션</span> 퇴근 후 스쿼트 30개 — 오후 7시 오픈
          </div>
          <div className="ticker-item">
            <span className="tag green">완료</span> 아침 공복 스트레칭 10분 — 89명 성공
          </div>
          <div className="ticker-item">
            <span className="tag red">진행중</span> 오늘 SNS 1시간 이하 사용 — 마감 자정
          </div>
          <div className="ticker-item">
            <span className="tag">새 미션</span> 점심 혼밥 없이 동료와 식사 — 내일 12시
          </div>
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

            <div className="step" style={{ position: "relative" }}>
              <div className="step-num">02</div>
              <span className="step-icon">💳</span>
              <h3>참가비 결제</h3>
              <p>
                단 1,000원으로 미션에 참여하세요. 소액이라 부담 없고,
                걸린 돈이 있어야 진짜 하게 됩니다.
              </p>
              <div className="step-arrow">→</div>
            </div>

            <div className="step" style={{ position: "relative" }}>
              <div className="step-num">03</div>
              <span className="step-icon">📸</span>
              <h3>미션 인증</h3>
              <p>
                사진 한 장, GPS 자동 기록. 복잡한 인증 없이
                마감 시간 전에 업로드만 하면 완료입니다.
              </p>
              <div className="step-arrow">→</div>
            </div>

            <div className="step">
              <div className="step-num">04</div>
              <span className="step-icon">🎁</span>
              <h3>환급 또는 기부</h3>
              <p>
                성공하면 참가비 전액 환급. 실패해도 괜찮아요 —
                내 돈이 좋은 곳에 쓰입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE MISSIONS */}
      <section id="missions">
        <div className="container">
          <div className="section-label">LIVE MISSIONS</div>
          <h2 className="section-title">오늘의 미션</h2>
          <p className="section-desc">
            매일 새로운 미션이 열립니다. 지금 참여할 수 있는 미션을 확인하세요.
          </p>

          <div className="missions-grid">
            <div className="mission-card" onClick={() => setIsModalOpen(true)}>
              <div className="mission-header">
                <span className="mission-category">건강</span>
                <span className="mission-time">
                  <span className="time-dot"></span> 3시간 남음
                </span>
              </div>
              <div className="mission-title">점심시간 15분 걷기 🚶</div>
              <div className="mission-desc">
                오늘 점심시간 안에 밖으로 나가 15분 이상 걸어보세요.
                어디든 OK — 걷는 풍경 사진 한 장이 인증 방법입니다.
              </div>
              <div className="mission-footer">
                <div className="mission-pot">
                  <span className="pot-icon">🍯</span>
                  <div>
                    <div className="pot-amount">4,200원</div>
                    <div className="pot-label">현재 팟</div>
                  </div>
                </div>
                <button className="mission-btn">1,000원 참여</button>
              </div>
              <div className="mission-participants">
                <div className="avatars">
                  <div className="avatar">😊</div>
                  <div className="avatar">🙂</div>
                  <div className="avatar">😄</div>
                </div>
                외 34명 참여 중
              </div>
            </div>

            <div className="mission-card green" onClick={() => setIsModalOpen(true)}>
              <div className="mission-header">
                <span className="mission-category">습관</span>
                <span className="mission-time">
                  <span className="time-dot"></span> 자정 마감
                </span>
              </div>
              <div className="mission-title">오늘 물 2L 마시기 💧</div>
              <div className="mission-desc">
                하루 권장 수분 섭취량 2L를 채워보세요.
                물병 눈금 사진으로 간단하게 인증합니다.
              </div>
              <div className="mission-footer">
                <div className="mission-pot">
                  <span className="pot-icon">🍯</span>
                  <div>
                    <div className="pot-amount">8,000원</div>
                    <div className="pot-label">현재 팟</div>
                  </div>
                </div>
                <button className="mission-btn">1,000원 참여</button>
              </div>
              <div className="mission-participants">
                <div className="avatars">
                  <div className="avatar">🥤</div>
                  <div className="avatar">💪</div>
                  <div className="avatar">🌿</div>
                </div>
                외 79명 참여 중
              </div>
            </div>

            <div className="mission-card orange" onClick={() => setIsModalOpen(true)}>
              <div className="mission-header">
                <span className="mission-category">운동</span>
                <span className="mission-time">오후 7시 오픈</span>
              </div>
              <div className="mission-title">퇴근 후 스쿼트 30개 🏋️</div>
              <div className="mission-desc">
                퇴근하고 집에서 스쿼트 30개. 영상 5초면 인증 완료.
                오늘 저녁, 딱 한 번만 해봐요.
              </div>
              <div className="mission-footer">
                <div className="mission-pot">
                  <span className="pot-icon">🍯</span>
                  <div>
                    <div className="pot-amount">준비중</div>
                    <div className="pot-label">곧 오픈</div>
                  </div>
                </div>
                <button className="mission-btn" style={{ opacity: 0.5 }}>알림 받기</button>
              </div>
              <div className="mission-participants">
                <div className="avatars">
                  <div className="avatar">🏃</div>
                  <div className="avatar">⚡</div>
                </div>
                12명 사전 신청
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS MODEL */}
      <section className="how" id="model">
        <div className="container">
          <div className="section-label">BUSINESS MODEL</div>
          <h2 className="section-title">어떻게 돈이 돌까요?</h2>
          <p className="section-desc">
            참가비의 흐름이 투명합니다. 성공자에겐 전액 환급,
            실패자의 돈은 기부와 플랫폼 운영으로 나뉩니다.
          </p>

          <div className="model-wrap">
            <div className="flow-diagram">
              <div className="flow-node">
                <h4>참여자</h4>
                <p>미션 참가비 1,000원 납부</p>
              </div>
              <div className="flow-connector">↓</div>
              <div className="flow-node platform">
                <span className="platform-badge">PLATFORM</span>
                <h4>미션팟 에스크로</h4>
                <p>미션 마감까지 안전 보관</p>
              </div>
              <div className="flow-connector">↓</div>
              <div className="flow-split">
                <div className="flow-node success">
                  <span className="success-badge">✓ 성공</span>
                  <h4>전액 환급</h4>
                  <p>1,000원 100% 돌려받기</p>
                </div>
                <div className="flow-node fail">
                  <span className="fail-badge">✗ 실패</span>
                  <h4>기부 + 수수료</h4>
                  <p>700원 기부 · 300원 운영</p>
                </div>
              </div>
            </div>

            <div className="model-text">
              <div className="feature-list">
                <div className="feature-item">
                  <div className="feature-icon">💰</div>
                  <div>
                    <h4>손실 회피 심리 활용</h4>
                    <p>
                      "1,000원을 잃기 싫어서" 실천하게 만드는 넛지 효과.
                      목표 설정 앱보다 실행률이 3배 높습니다.
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">❤️</div>
                  <div>
                    <h4>실패해도 의미 있음</h4>
                    <p>
                      실패한 참가비가 NGO에 기부됩니다.
                      "어차피 좋은 일" 덕분에 재도전율이 높아집니다.
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📈</div>
                  <div>
                    <h4>지속 가능한 수익 구조</h4>
                    <p>
                      실패 참가비의 30%가 운영 수익. 참여자가 늘수록
                      기부 규모와 수익이 함께 성장합니다.
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🤝</div>
                  <div>
                    <h4>B2B 기업 웰니스 연계</h4>
                    <p>
                      기업이 직원 미션 참가비를 지원하는 복지 프로그램.
                      월 구독 형태로 안정적 매출 확보.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL IMPACT */}
      <section className="impact" id="impact">
        <div className="container">
          <div className="section-label">SOCIAL IMPACT</div>
          <h2 className="section-title">실패도 세상을 바꿉니다</h2>
          <p className="section-desc">
            미션팟의 기부금은 검증된 NGO 파트너를 통해 투명하게 집행됩니다.
          </p>

          <div className="impact-grid">
            <div className="impact-card">
              <span className="impact-emoji">🌱</span>
              <div className="impact-num green">312만원</div>
              <h3>누적 기부액</h3>
              <p>환경·교육·아동 분야 NGO 3곳에 매월 투명하게 전달됩니다.</p>
            </div>
            <div className="impact-card">
              <span className="impact-emoji">🏃</span>
              <div className="impact-num orange">4,782명</div>
              <h3>누적 참여자</h3>
              <p>한 번 참여한 사람의 73%가 다음 달에도 미션에 도전했습니다.</p>
            </div>
            <div className="impact-card">
              <span className="impact-emoji">✅</span>
              <div className="impact-num green">68%</div>
              <h3>평균 성공률</h3>
              <p>일반 목표 설정 앱 대비 2.4배 높은 실행 완료율을 기록했습니다.</p>
            </div>
            <div className="impact-card">
              <span className="impact-emoji">🤲</span>
              <div className="impact-num red">NGO 3곳</div>
              <h3>기부 파트너</h3>
              <p>초록우산·굿네이버스·환경재단과 파트너십 협의 중입니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TARGET */}
      <section>
        <div className="container">
          <div className="section-label">TARGET USER</div>
          <h2 className="section-title">이런 분들이 좋아해요</h2>
          <p className="section-desc">
            큰 결심 없이 작은 실천을 원하는 모든 분들을 위한 서비스입니다.
          </p>

          <div className="target-cards">
            <div className="target-card">
              <div className="target-avatar">💼</div>
              <h3>바쁜 직장인</h3>
              <p>
                운동해야지, 건강 챙겨야지 하면서도 매일 미루는 분들.
                알림 한 번에 오늘 딱 하나만 실천하게 해드립니다.
              </p>
              <span className="target-tag">25–35세 직장인</span>
            </div>
            <div className="target-card">
              <div className="target-avatar">📚</div>
              <h3>자기계발 욕심러</h3>
              <p>
                앱 3개 깔았다가 다 포기한 경험 있는 분들.
                1,000원이 걸리면 진짜 하게 됩니다.
              </p>
              <span className="target-tag">자기계발 관심층</span>
            </div>
            <div className="target-card">
              <div className="target-avatar">🌍</div>
              <h3>소셜 임팩트 공감자</h3>
              <p>
                내 작은 행동이 기부로 연결된다는 사실에 보람을 느끼는 분들.
                실패도 의미 있는 경험이 됩니다.
              </p>
              <span className="target-tag">ESG·사회공헌 관심층</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg"></div>
        <div className="container">
          <div className="section-label">EARLY ACCESS</div>
          <h2 className="section-title">지금 바로 시작하세요</h2>
          <p className="section-desc" style={{ margin: "20px auto 44px" }}>
            베타 출시 알림을 신청하면 첫 미션 참가비를 무료로 드립니다.
          </p>
          <div className="cta-price">
            1,000<small>원부터</small>
          </div>
          <p className="cta-note">성공하면 전액 환급 · 실패해도 기부로 의미 있는 하루</p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            🚀 출시 알림 받고 첫 미션 무료로
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="logo">
          미션<span style={{ color: "var(--accent)" }}>팟</span>
        </div>
        <p>
          소셜 임팩트 챌린지 서비스 · 베타 서비스 준비 중
          <br />
          문의: hello@missionpot.kr · 서울특별시
        </p>
        <p style={{ marginTop: "16px", fontSize: "0.75rem", color: "rgba(107,107,128,0.6)" }}>
          © 2025 미션팟. 본 서비스는 사행행위 규제 준수를 위해 법무 검토 중입니다.
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
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              취소
            </button>
            <button className="btn-primary" onClick={handleSuccessAlert}>
              1,000원 결제 &amp; 참여
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
