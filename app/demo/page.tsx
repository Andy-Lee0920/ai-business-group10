import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isPresentationHost, isPresentationMode } from '../../src/config';
import { DualPanelDemoClient } from './dual-panel-demo-client';

export const metadata: Metadata = {
  title: 'Fevio dual-view demo',
  description: '치료 상황에 따라 환자 화면과 파트너 역할이 함께 바뀌는 발표용 데모입니다.',
};

export const dynamic = 'force-dynamic';

export default async function DemoPage() {
  const requestHeaders = await headers();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));

  if (!presentationMode) {
    notFound();
  }

  return <DualPanelDemoClient />;
}
