import Link from 'next/link';

export function DailyBrief({ line, compact = false }: { line: string; compact?: boolean }) {
  if (compact) {
    return (
      <div data-testid="daily-brief-preview" style={previewStyle}>
        <span aria-hidden="true" style={dotStyle} />
        <strong style={previewTextStyle}>{line}</strong>
      </div>
    );
  }

  return (
    <section aria-label="오늘의 브리프" data-testid="daily-brief-hero" style={heroStyle}>
      <div aria-hidden="true" style={botanicalStyle} />
      <p style={kickerStyle}>오늘의 브리프</p>
      <h2 style={headlineStyle}>{line}</h2>
      <p style={bodyStyle}>확정된 병원 안내와 오늘 일정만 기준으로 정리해요.</p>
    </section>
  );
}

export function EmptyHomeActions() {
  return (
    <div data-testid="empty-home-actions" style={actionWrapStyle}>
      <Link href="/onboard/prescription-capture" style={primaryLinkStyle}>첫 안내문 넣기</Link>
      <Link href="/settings" style={secondaryLinkStyle}>파트너 초대하기</Link>
    </div>
  );
}

const heroStyle = {
  position: 'relative',
  display: 'grid',
  alignContent: 'center',
  minHeight: '100%',
  gap: 10,
  overflow: 'hidden',
} as const;

const botanicalStyle = {
  position: 'absolute',
  right: -22,
  top: 24,
  width: 168,
  height: 168,
  borderRadius: '44% 56% 48% 52%',
  background: 'radial-gradient(circle at 34% 32%, rgba(134, 164, 126, 0.28), transparent 34%), linear-gradient(135deg, rgba(193, 210, 185, 0.22), rgba(231, 121, 102, 0.10))',
  transform: 'rotate(-12deg)',
} as const;

const kickerStyle = { margin: 0, color: 'var(--slc-coral)', fontSize: 13, fontWeight: 900 } as const;
const headlineStyle = { margin: 0, color: 'var(--slc-text)', fontSize: 27, lineHeight: 1.18, letterSpacing: '-0.05em', fontWeight: 950, maxWidth: 300 } as const;
const bodyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, lineHeight: 1.5, maxWidth: 260, fontWeight: 700 } as const;
const previewStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.68)', border: '1px solid var(--slc-border)' } as const;
const dotStyle = { width: 8, height: 8, borderRadius: 999, background: 'var(--slc-sage)' } as const;
const previewTextStyle = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--slc-text)', fontSize: 13 } as const;
const actionWrapStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 12px' } as const;
const primaryLinkStyle = { textAlign: 'center', textDecoration: 'none', padding: '13px 12px', borderRadius: 999, color: '#fff', background: 'var(--slc-coral-gradient)', fontWeight: 900, fontSize: 14 } as const;
const secondaryLinkStyle = { textAlign: 'center', textDecoration: 'none', padding: '13px 12px', borderRadius: 999, color: 'var(--slc-text)', background: 'rgba(255,255,255,0.72)', border: '1px solid var(--slc-border)', fontWeight: 900, fontSize: 14 } as const;
