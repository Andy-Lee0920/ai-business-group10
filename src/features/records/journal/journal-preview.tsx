interface JournalPreviewProps {
  recentActivityCount: number;
  upcomingCount: number;
}

export function JournalPreview({ recentActivityCount, upcomingCount }: JournalPreviewProps) {
  return (
    <section aria-label="부부간 기록" style={{ padding: '0 16px 14px' }}>
      <article data-testid="couple-journal-preview" style={primaryCardStyle}>
        <span style={sectionEyebrowStyle}>부부간</span>
        <h2 style={sectionTitleStyle}>오늘의 마음과 경험을 둘만 볼 수 있게 남겨요</h2>
        <p style={sectionBodyStyle}>
          다음 단계에서는 기분, 메모, 사진을 날짜별로 모아 서로 확인할 수 있게 합니다.
        </p>
        <div style={metaGridStyle}>
          <MetaCell label="최근 활동" value={`${recentActivityCount}건`} />
          <MetaCell label="남은 일정" value={`${upcomingCount}개`} />
        </div>
      </article>
    </section>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaCellStyle}>
      <span style={metaLabelStyle}>{label}</span>
      <strong style={metaValueStyle}>{value}</strong>
    </div>
  );
}

const primaryCardStyle = {
  borderRadius: 28,
  background: 'rgba(255,255,255,0.86)',
  border: '1px solid var(--slc-border)',
  boxShadow: '0 18px 48px rgba(80, 50, 40, 0.08)',
  padding: 22,
} as const;

const sectionEyebrowStyle = {
  display: 'inline-block',
  margin: '0 0 8px',
  color: 'var(--fevio-sage-dark)',
  fontSize: 12,
  fontWeight: 900,
} as const;

const sectionTitleStyle = {
  color: 'var(--slc-text)',
  fontSize: 21,
  fontWeight: 950,
  letterSpacing: '-0.05em',
  lineHeight: 1.25,
  margin: 0,
} as const;

const sectionBodyStyle = {
  color: 'var(--slc-muted)',
  fontSize: 13,
  fontWeight: 750,
  lineHeight: 1.55,
  margin: '10px 0 0',
} as const;

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
  marginTop: 16,
} as const;

const metaCellStyle = {
  borderRadius: 18,
  background: 'rgba(255, 252, 250, 0.88)',
  border: '1px solid var(--slc-border)',
  padding: '12px 11px',
} as const;

const metaLabelStyle = {
  display: 'block',
  color: 'var(--slc-muted)',
  fontSize: 10,
  fontWeight: 900,
  marginBottom: 5,
} as const;

const metaValueStyle = {
  color: 'var(--slc-text)',
  fontSize: 16,
  fontWeight: 950,
  letterSpacing: '-0.03em',
} as const;
