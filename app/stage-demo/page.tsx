import type { Metadata } from 'next';
import { StageDemoClient } from './StageDemoClient';

export const metadata: Metadata = {
  title: 'Fevio — 시술 단계 확인',
  description: 'IVF 시술 단계별 병원 안내를 실행 일정으로 정리하는 화면',
};

export default function StageDemoPage() {
  return <StageDemoClient />;
}
