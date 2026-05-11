import Link from 'next/link';
import { headers } from 'next/headers';
import { Card } from '../src/components/ui';
import { isPresentationHost, isPresentationMode } from '../src/config';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const requestHeaders = await headers();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));

  return (
    <main className="app-shell">
      <Card aria-labelledby="landing-title" className="hero-card">
        <p className="eyebrow">{presentationMode ? 'Presentation demo' : 'IVF care-operation'}</p>
        <h1 id="landing-title">Fevio [페비오]</h1>
        <p className="lead">
          {presentationMode
            ? '로그인 없이 발표용 시나리오를 바로 보여주는 Fevio 데모입니다.'
            : '병원에서 들은 말을, 오늘 부부가 함께 실행할 카드로.'}
        </p>
        <div className="cta-row">
          {presentationMode ? (
            <>
              <Link className="primary-cta" href="/home">
                발표 데모 바로 보기
              </Link>
              <Link className="secondary-cta" href="/privacy?mode=presentation">
                Privacy Gate부터 보기
              </Link>
            </>
          ) : (
            <>
              <Link className="primary-cta" href="/auth/sign-in">
                Google로 시작하기
              </Link>
              <Link className="secondary-cta" href="/privacy">
                개인정보 처리방침
              </Link>
            </>
          )}
        </div>
      </Card>
    </main>
  );
}
