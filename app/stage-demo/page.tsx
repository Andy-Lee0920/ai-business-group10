import type { Metadata } from 'next';
import { StageDemoClient } from './StageDemoClient';

export const metadata: Metadata = {
  title: 'Fevio — 시술 단계 UI',
  description: 'IVF 시술 단계별 홈 화면 디자인 미리보기',
};

export default function StageDemoPage() {
  return <StageDemoClient />;
}
