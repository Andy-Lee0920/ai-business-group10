import Link from 'next/link';

export function DailyBrief({ line, compact = false }: { line: string; compact?: boolean }) {
  if (compact) {
    return (
      <div data-testid="daily-brief-preview" style={previewStyle}>
        <span aria-hidden="true" style={previewDotStyle} />
        <strong style={previewTextStyle}>{line}</strong>
      </div>
    );
  }

  return (
    <section aria-label="오늘의 브리프" data-testid="daily-brief-hero" style={heroStyle}>
      <div style={kickerRowStyle}>
        <span aria-hidden="true" style={kickerDotStyle} />
        <p style={kickerStyle}>오늘의 브리프</p>
      </div>
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
  display: 'grid',
  alignContent: 'end',
  height: '100%',
  gap: 10,
  paddingBottom: 2,
} as const;

const kickerRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
} as const;

const kickerDotStyle = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: 'var(--slc-coral)',
  flexShrink: 0,
} as const;

const kickerStyle = {
  margin: 0,
  color: 'var(--slc-coral)',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
} as const;

const headlineStyle = {
  margin: 0,
  color: 'var(--slc-text)',
  fontSize: 30,
  lineHeight: 1.15,
  letterSpacing: '-0.055em',
  fontWeight: 950,
  maxWidth: 265,
  wordBreak: 'keep-all',
} as const;

const bodyStyle = {
  margin: 0,
  color: 'var(--slc-muted)',
  fontSize: 13,
  lineHeight: 1.52,
  maxWidth: 225,
  fontWeight: 700,
} as const;

const previewStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '11px 16px',
  borderRadius: 20,
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid var(--slc-border)',
} as const;

const previewDotStyle = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: 'var(--slc-coral)',
  flexShrink: 0,
} as const;

const previewTextStyle = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'var(--slc-text)',
  fontSize: 13,
  fontWeight: 800,
} as const;

const actionWrapStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  padding: '0 16px 12px',
} as const;

const primaryLinkStyle = {
  textAlign: 'center',
  textDecoration: 'none',
  padding: '14px 12px',
  borderRadius: 999,
  color: '#fff',
  background: 'var(--slc-coral-gradient)',
  fontWeight: 900,
  fontSize: 14,
} as const;

const secondaryLinkStyle = {
  textAlign: 'center',
  textDecoration: 'none',
  padding: '14px 12px',
  borderRadius: 999,
  color: 'var(--slc-text)',
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid var(--slc-border)',
  fontWeight: 900,
  fontSize: 14,
} as const;
