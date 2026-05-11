import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { EmotionInputClient } from './emotion-input-client';

export default async function EmotionPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className="app-shell">
      <Card aria-labelledby="emotion-title" tone="lavender">
        <p className="eyebrow">Emotion Input</p>
        <h1 id="emotion-title">감정 부담을 조용히 남겨요</h1>
        <p className="lead">내가 힘든 만큼만 기록하고, 파트너 공유는 선택할 때만 켜요.</p>
        <Notice tone="lavender">공유해도 원문 감정 메모는 보내지 않고, 파트너가 할 수 있는 조용한 도움만 보여줘요.</Notice>
        <EmotionInputClient />
      </Card>
    </main>
  );
}
