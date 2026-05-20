const COMMUNITY_CHIPS = ['통증', '걱정', '오늘', '팁'] as const;

export function CommunityPreview() {
  return (
    <section aria-label="커뮤니티" style={{ padding: '0 16px 0' }}>
      <article data-testid="community-preview" style={secondaryCardStyle}>
        <span style={sectionEyebrowStyle}>커뮤니티</span>
        <h2 style={sectionTitleStyle}>같은 역할의 사람들과 안전하게 공감해요</h2>
        <p style={sectionBodyStyle}>
          통증, 걱정, 오늘의 상태, 팁을 역할별 피드로 나누고 운영팀 검수 후 보여줄 예정입니다.
        </p>
        <div style={chipRowStyle}>
          {COMMUNITY_CHIPS.map((label) => (
            <span key={label} style={chipStyle}>{label}</span>
          ))}
        </div>
      </article>
    </section>
  );
}

const secondaryCardStyle = {
  borderRadius: 28,
  background: 'rgba(248, 244, 255, 0.76)',
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

const chipRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 16,
} as const;

const chipStyle = {
  borderRadius: 999,
  background: 'rgba(255, 255, 255, 0.82)',
  border: '1px solid var(--slc-border)',
  color: 'var(--slc-text)',
  fontSize: 12,
  fontWeight: 900,
  padding: '8px 11px',
} as const;
