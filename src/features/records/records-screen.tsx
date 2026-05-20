'use client';
import type { ScheduleItem, CompletionRecord, ClinicUpdate } from '../../types/mvp.types';
import type { CoupleJournalEntry } from '../../types/journal.types';
import type { CommunityAudience, CommunityPostListItem } from '../../types/community.types';
import { AmbientStoryBackground } from '../../components/ambient-story-background';
import { slcAssets } from '../../design/slc-assets';
import { CommunityPreview } from './community/community-preview';
import { JournalPreview } from './journal/journal-preview';

interface RecordsScreenProps {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates?: ClinicUpdate[];
  journalEntries?: CoupleJournalEntry[];
  communityPosts?: CommunityPostListItem[];
  communityAudience?: CommunityAudience;
}

export function RecordsScreen({ items, completions, clinicUpdates = [], journalEntries = [], communityPosts = [], communityAudience = 'primary_feed' }: RecordsScreenProps) {
  const recentActivityCount = completions.length + clinicUpdates.length + journalEntries.length;
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
          <p style={leadStyle}>부부간 기록과 역할별 커뮤니티를 한 곳에서 확인해요. 최근 활동 {recentActivityCount}건</p>
        </div>
      </header>

      <JournalPreview entries={journalEntries} upcomingCount={upcomingCount} />
      <CommunityPreview posts={communityPosts} audience={communityAudience} />
    </AmbientStoryBackground>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, padding: '0 24px 18px' } as const;
const eyebrowStyle = { fontSize: 13, color: '#B5A89E', fontWeight: 800, margin: '0 0 4px' } as const;
const titleStyle = { fontSize: 30, fontWeight: 950, color: 'var(--slc-text)', margin: 0, letterSpacing: '-0.06em', lineHeight: 1 } as const;
const leadStyle = { maxWidth: 290, margin: '9px 0 0', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 700, lineHeight: 1.45 } as const;
