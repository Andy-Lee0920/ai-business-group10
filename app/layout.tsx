import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { isPresentationMode } from '../src/config';
import './globals.css';
import './fevio-ui.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fevio.app'),
  title: 'Fevio SLC',
  description: '오늘의 IVF 주사·복용·병원 일정을 확인하고 완료를 기록하는 Fevio SLC.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Fevio SLC',
    description: '오늘의 실행 단위로 IVF 일정을 확인하고 조용히 기록합니다.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Fevio SLC Today execution loop' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#C95F4B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const presentationMode = isPresentationMode() ? '1' : '0';
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body
        data-presentation-mode={presentationMode}
        data-iphone-frame="0"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=new URLSearchParams(location.search);var f=(p.get('frame')||'').toLowerCase();if(f==='iphone'||f==='1'||f==='true'||(p.get('device')||'').toLowerCase()==='iphone'){document.body.dataset.iphoneFrame='1';}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
