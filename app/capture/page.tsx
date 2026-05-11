import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, Notice } from '../../src/components/ui';
import { isPresentationHost, isPresentationMode } from '../../src/config';
import { getPresentationClinicMemo } from '../../src/lib/presentation-demo-data';
import { CaptureForm } from './capture-form';

export default async function CapturePage() {
  const requestHeaders = await headers();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));
  const cookieStore = await cookies();
  if (cookieStore.get('fevio_privacy_accepted')?.value !== '1') redirect('/privacy');

  return (
    <main className="app-shell">
      <Card aria-labelledby="capture-title">
        <p className="eyebrow">Post-Visit Capture</p>
        <h2 id="capture-title">병원 메모를 그대로 붙여넣기</h2>
        <p className="lead">잘 모르겠는 내용도 그대로 적어도 괜찮아요. 확인이 필요한 항목은 따로 표시됩니다.</p>
        <Notice tone="sage">약/주사, 시간, 다음 방문, 파트너에게 부탁할 일을 한 번에 적어도 됩니다.</Notice>
        <CaptureForm initialRawText={presentationMode ? getPresentationClinicMemo() : ''} presentationMode={presentationMode} />
      </Card>
    </main>
  );
}
