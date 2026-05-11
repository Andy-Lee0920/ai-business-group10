import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import './fevio-ui.css';
import './capture-flow.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fevio.app'),
  title: 'Fevio [페비오]',
  description: '병원에서 들은 말을 오늘의 부부 케어 흐름으로 바꾸는 IVF care-operation webapp.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Fevio [페비오]',
    description: '병원 메모를 오늘의 부부 케어 흐름으로 바꾸는 IVF care-operation 앱',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Fevio dual-view care card preview' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#6F8F6E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body>{children}</body>
    </html>
  );
}
