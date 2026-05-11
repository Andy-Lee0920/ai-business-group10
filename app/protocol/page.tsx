import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { getFevioIconAsset } from '../../src/design/assets';
import { ProtocolInputClient } from './protocol-input-client';

export default async function ProtocolPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');
  const icon = getFevioIconAsset('clinicNote');

  return (
    <main className="app-shell">
      <Card aria-labelledby="protocol-title">
        <img alt="" aria-hidden="true" height={48} src={icon.path} width={48} />
        <p className="eyebrow">Protocol Draft</p>
        <h2 id="protocol-title">병원 안내를 초안으로만 나눠요</h2>
        <p className="lead">일정·약·주사처럼 보이는 항목을 먼저 초안으로 보여주고, 내가 확인한 것만 홈에 반영해요.</p>
        <Notice tone="sage">시간, 약 이름, 의미가 애매한 항목은 확정 전 확인 표시가 붙어요.</Notice>
        <ProtocolInputClient />
      </Card>
    </main>
  );
}
