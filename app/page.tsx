import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="app-shell">
      <section className="hero-card" aria-labelledby="home-title">
        <p className="eyebrow">SLC scaffold</p>
        <h1 id="home-title">Fevio [페비오]</h1>
        <p className="lead">병원 메모를 오늘의 실행 카드로 바꾸는 웹앱</p>
        <p className="lead">
          첫 SLC는 Google login, Privacy Gate, onboarding home, 병원 메모 입력, Manual Split, Confirm,
          Dynamic Home 전환을 검증하는 방향으로 구현합니다.
        </p>
        <div className="cta-row">
          <Link className="primary-cta" href="/capture">
            병원 메모 입력 준비
          </Link>
          <Link className="secondary-cta" href="/privacy">
            Privacy Gate 보기
          </Link>
        </div>
        <ul className="status-list" aria-label="준비된 기반">
          <li>모바일 우선 앱 shell</li>
          <li>Fevio 디자인 토큰 baseline</li>
          <li>Supabase/Vercel env 계약 준비</li>
        </ul>
      </section>
    </main>
  );
}
