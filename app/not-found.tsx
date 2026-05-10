import Link from 'next/link';
import { Card } from '../src/components/ui';

export default function NotFound() {
  return (
    <main className="app-shell">
      <Card aria-labelledby="notfound-title" className="hero-card">
        <p className="eyebrow">404</p>
        <h1 id="notfound-title">페이지를 찾을 수 없어요</h1>
        <p className="lead">주소가 잘못되었거나 삭제된 페이지입니다.</p>
        <div className="cta-row">
          <Link className="primary-cta" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </Card>
    </main>
  );
}
