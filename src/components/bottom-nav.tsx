'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export const NAV_ITEMS = [
  { href: '/home', label: '홈', icon: '○' },
  { href: '/records', label: '기록', icon: '≡' },
  { href: '/more', label: '더보기', icon: '⋯' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(255, 252, 250, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #F0EDE8',
      display: 'flex', justifyContent: 'space-around',
      padding: '12px 0 max(20px, env(safe-area-inset-bottom))',
      zIndex: 50,
    }}>
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: active ? '#C4614A' : '#B5A89E',
            textDecoration: 'none', fontSize: 12, fontWeight: active ? 700 : 400,
            padding: '4px 16px',
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
