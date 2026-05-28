'use client';

import { Card } from '../src/components/ui';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell">
      <Card aria-labelledby="error-title" className="hero-card">
        <p className="eyebrow">오류</p>
        <h1 id="error-title">오류가 발생했어요</h1>
        <p className="lead">잠시 후 다시 시도해주세요.</p>
        <div className="cta-row">
          <button className="primary-cta" onClick={reset} type="button">
            다시 시도
          </button>
        </div>
      </Card>
    </main>
  );
}
