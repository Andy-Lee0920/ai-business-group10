import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { MedicationInputClient } from './medication-input-client';

export default async function MedicationPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className="app-shell">
      <Card aria-labelledby="medication-title">
        <p className="eyebrow">Medication Input</p>
        <h1 id="medication-title">약·주사 챙김을 짧게 남겨요</h1>
        <p className="lead">이름, 용량, 시간만 확인해서 오늘 케어 흐름에 남깁니다. 용량은 자동으로 채우지 않아요.</p>
        <Notice tone="sage">병원 안내를 그대로 옮겨 적고, 확실한 내용만 저장해 주세요.</Notice>
        <MedicationInputClient />
      </Card>
    </main>
  );
}
