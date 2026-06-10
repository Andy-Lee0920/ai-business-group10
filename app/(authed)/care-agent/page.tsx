import Link from 'next/link';
import { CareAgentClient } from './care-agent-client';

export const dynamic = 'force-dynamic';

export default function CareAgentPage() {
  return (
    <main style={pageStyle} data-testid="care-agent-page">
      <section aria-labelledby="care-agent-title" style={panelStyle}>
        <p style={eyebrowStyle}>케어 에이전트</p>
        <h1 id="care-agent-title" style={titleStyle}>무엇을 확인할까요?</h1>
        <p style={leadStyle}>필요한 화면으로 안내하고, 저장 전 직접 확인해요.</p>
        <CareAgentClient />
        <div aria-label="빠른 이동" style={routeGridStyle}>
          <Link href="/add" style={routeChipStyle}>
            <strong>주사·복약 남기기</strong>
          </Link>
          <Link href="/clinic-update" style={routeChipStyle}>
            <strong>병원 방문 남기기</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: '100dvh',
  padding: 'var(--fevio-page-top) var(--fevio-page-gutter) var(--fevio-page-bottom)',
  background: 'var(--slc-bg)',
} as const;

const panelStyle = {
  display: 'grid',
  gap: 16,
  padding: 20,
  borderRadius: 28,
  background: 'rgba(255, 252, 247, 0.92)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-text)',
} as const;

const eyebrowStyle = {
  margin: 0,
  color: 'var(--fevio-sage-dark)',
  fontSize: 13,
  fontWeight: 900,
} as const;

const titleStyle = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.18,
  letterSpacing: '-0.04em',
  fontWeight: 950,
} as const;

const leadStyle = {
  margin: 0,
  color: 'var(--slc-muted)',
  fontSize: 14,
  lineHeight: 1.55,
  fontWeight: 750,
} as const;

const routeGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
} as const;

const routeChipStyle = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 48,
  padding: '12px 10px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-text)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 900,
  textAlign: 'center',
} as const;
