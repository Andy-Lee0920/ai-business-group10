import Link from 'next/link';
import { Card } from '../src/components/ui';

export default function LandingPage() {
  return (
    <main className="app-shell">
      <Card aria-labelledby="landing-title" className="hero-card">
        <p className="eyebrow">IVF care-operation</p>
        <h1 id="landing-title">Fevio [페비오]</h1>
        <p className="lead">병원에서 들은 말을, 오늘 부부가 함께 실행할 카드로.</p>
        <div className="cta-row">
          <Link className="primary-cta" href="/auth/sign-in">
            Google로 시작하기
          </Link>
          <Link className="secondary-cta" href="/privacy">
            개인정보 처리방침
          </Link>
        </div>
      </Card>
    </main>
  );
}
