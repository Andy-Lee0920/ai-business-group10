import type { Metadata } from 'next';
import './globals.css';
import './fevio-ui.css';
import './capture-flow.css';

export const metadata: Metadata = {
  title: 'Fevio [페비오]',
  description: '병원에서 들은 말을 오늘의 부부 실행 카드로 바꾸는 IVF care-operation webapp.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
