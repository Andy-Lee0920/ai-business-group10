'use client';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/mvp.types';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates?: ClinicUpdate[];
}

export function RecordsScreen({ items, completions, clinicUpdates = [] }: RecordsScreenProps) {
  const recentActivityCount = completions.length + clinicUpdates.length;
  const upcomingCount = items.filter((item) => item.status !== 'completed').length;

  return (
    <AmbientStoryBackground
      asset={slcAssets.home.missedRecovery}
      intensity="subtle"
      style={{ minHeight: '100dvh', padding: '54px 0 112px' }}
    >
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>함께 남기는 기록</p>
          <h1 style={titleStyle}>기록</h1>
          <p style={leadStyle}>부부간 기록과 커뮤니티를 나눠 담을 준비를 하고 있어요.</p>
        </div>
      </header>

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

      <section aria-label="커뮤니티" style={{ padding: '0 16px 0' }}>
        <article data-testid="community-preview" style={secondaryCardStyle}>
          <span style={sectionEyebrowStyle}>커뮤니티</span>
          <h2 style={sectionTitleStyle}>같은 역할의 사람들과 안전하게 공감해요</h2>
          <p style={sectionBodyStyle}>
            통증, 걱정, 오늘의 상태, 팁을 역할별 피드로 나누고 운영팀 검수 후 보여줄 예정입니다.
          </p>
          <div style={chipRowStyle}>
            {['통증', '걱정', '오늘', '팁'].map((label) => (
              <span key={label} style={chipStyle}>{label}</span>
            ))}
          </div>
        </article>
      </section>
    </AmbientStoryBackground>
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

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 18,
  padding: '0 24px 18px',
} as const;

const eyebrowStyle = {
  fontSize: 13,
  color: '#B5A89E',
  fontWeight: 800,
  margin: '0 0 4px',
} as const;

const titleStyle = {
  fontSize: 30,
  fontWeight: 950,
  color: 'var(--slc-text)',
  margin: 0,
  letterSpacing: '-0.06em',
  lineHeight: 1,
} as const;

const leadStyle = {
  maxWidth: 270,
  margin: '9px 0 0',
  color: 'var(--slc-muted)',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.45,
} as const;

const primaryCardStyle = {
  borderRadius: 28,
  background: 'rgba(255,255,255,0.86)',
  border: '1px solid var(--slc-border)',
  boxShadow: '0 18px 48px rgba(80, 50, 40, 0.08)',
  padding: 22,
} as const;

const secondaryCardStyle = {
  ...primaryCardStyle,
  background: 'rgba(248, 244, 255, 0.76)',
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
