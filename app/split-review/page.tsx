import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card } from '../../src/components/ui';
import { SplitReviewClient } from './split-review-client';

export default async function SplitReviewPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className="app-shell">
      <Card aria-labelledby="split-title">
        <p className="eyebrow">Manual Split</p>
        <h2 id="split-title">병원 메모에서 나눈 내용입니다</h2>
        <p className="lead">각 항목을 어디에 둘지 선택해 주세요.</p>
        <SplitReviewClient />
      </Card>
    </main>
  );
}
