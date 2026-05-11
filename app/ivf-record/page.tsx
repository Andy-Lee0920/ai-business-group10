import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { IvfRecordInputClient } from './ivf-record-input-client';

export default async function IvfRecordPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className="app-shell">
      <Card aria-labelledby="ivf-record-title" tone="sage">
        <p className="eyebrow">IVF Record</p>
        <h1 id="ivf-record-title">시술 기록을 부담 없이 남겨요</h1>
        <p className="lead">단계와 날짜만으로도 충분해요. 결과 해석이나 평가 없이 내가 확인한 기록만 저장합니다.</p>
        <Notice tone="sage">파트너 공유는 기본 OFF예요. 공유해도 원문 결과와 메모는 보내지 않아요.</Notice>
        <IvfRecordInputClient />
      </Card>
    </main>
  );
}
