import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isPresentationHost, isPresentationMode } from '../../src/config';
import { DualPanelDemoClient } from './dual-panel-demo-client';
import type { IvfStageIndex } from './demo-scenarios';

export type DemoMode = 'intro' | 'input' | 'generated';

type DemoPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Fevio state-driven IVF demo',
  description: '하나의 IVF care state가 환자와 파트너에게 다른 utility UI로 번역되는 데모입니다.',
};

export const dynamic = 'force-dynamic';

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const requestHeaders = await headers();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));

  if (!presentationMode) {
    notFound();
  }

  const params = await searchParams;
  return <DualPanelDemoClient initialMode={normalizeMode(getParam(params, 'mode'), getParam(params, 'stage'))} initialStageIndex={normalizeStage(getParam(params, 'stage'))} />;
}

export function normalizeMode(mode: string | string[] | undefined, stage?: string | string[] | undefined): DemoMode {
  const value = Array.isArray(mode) ? mode[0] : mode;
  const stageValue = Array.isArray(stage) ? stage[0] : stage;
  if (value === 'input') return 'input';
  if (value === 'stage' && stageValue) return 'generated';
  return 'intro';
}

export function normalizeStage(stage: string | string[] | undefined): IvfStageIndex {
  const value = Array.isArray(stage) ? stage[0] : stage;
  return value === '1' || value === '2' || value === '3' || value === '4' || value === '5' || value === '6' || value === '7' ? value : '2';
}

function getParam(params: Record<string, string | string[] | undefined> | undefined, key: string) {
  return params?.[key];
}
