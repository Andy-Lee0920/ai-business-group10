import Link from 'next/link';
import { Badge, Card, Notice } from '../src/components/ui';

export default function HomePage() {
  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className="hero-card">
        <p className="eyebrow">SLC scaffold</p>
        <h1 id="home-title">Fevio [페비오]</h1>
        <p className="lead">병원 메모를 오늘의 실행 카드로 바꾸는 웹앱</p>
        <p className="lead">
          첫 SLC는 Google login, Privacy Gate, onboarding home, 병원 메모 입력, Manual Split, Confirm,
          Dynamic Home 전환을 검증하는 방향으로 구현합니다.
        </p>
        <div className="cta-row">
          <Link className="primary-cta" href="/auth/sign-in">
            Google로 시작하기
          </Link>
          <Link className="secondary-cta" href="/privacy">
            Privacy Gate 보기
          </Link>
          <Link className="secondary-cta" href="/capture">
            병원 메모 입력 준비
          </Link>
        </div>
        <ul className="status-list" aria-label="준비된 기반">
          <li>
            <Badge tone="sage">모바일 우선</Badge> 앱 shell
          </li>
          <li>
            <Badge tone="lavender">Design token</Badge> Fevio baseline
          </li>
          <li>
            <Badge tone="neutral">Env contract</Badge> Supabase/Vercel 준비
          </li>
        </ul>
        <Notice tone="coral">중요 상태는 색상만이 아니라 배지와 텍스트로 함께 표시합니다.</Notice>
      </Card>
    </main>
  );
}
